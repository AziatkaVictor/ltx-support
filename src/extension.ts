import { workspace, ExtensionContext, languages, CompletionItem, CompletionItemKind, window, MarkdownString, TextDocument, ProviderResult, SemanticTokensLegend, DocumentSemanticTokensProvider, SemanticTokens, SemanticTokensBuilder, CompletionItemProvider, Uri, DiagnosticCollection, Diagnostic, ConfigurationChangeEvent } from 'vscode';
import { LtxDocument } from "./ltx/ltxDocument";
import { getConditions, getFunctions, isInsideConditionsGroup, isInsideFunctionsGroup, updateScripts } from './luaParsing';
import { getPathToMisc, isDiagnosticEnabled } from './settings';

const tokenTypes = ['property', 'struct', 'class', 'number', 'keyword', 'function', 'variable', 'string'];
const tokenModifiers = ['declaration', 'definition', 'documentation', 'readonly'];
const legend = new SemanticTokensLegend(tokenTypes, tokenModifiers);

let diagnosticCollection: DiagnosticCollection;
let fileData: LtxDocument;
var documents: Map<TextDocument, LtxDocument> = new Map<TextDocument, LtxDocument>();

export function activate(context: ExtensionContext) {
    diagnosticCollection = languages.createDiagnosticCollection("ltx");

    workspace.onDidChangeTextDocument(onChange);
    workspace.onDidOpenTextDocument(createFileData);
    window.onDidChangeActiveTextEditor(createFileData);
    workspace.onDidChangeConfiguration(updateData);

    context.subscriptions.push(languages.registerCompletionItemProvider("ltx", getLogicFunctions(), '='));
    context.subscriptions.push(languages.registerCompletionItemProvider("ltx", getLogicConditions(), '=', '!'));
    context.subscriptions.push(languages.registerCompletionItemProvider("ltx", getOtherSections()));
    context.subscriptions.push(languages.registerDocumentSemanticTokensProvider("ltx", getSemanticLtx(), legend));

    window.showInformationMessage('LTX Support is started!');
}

function updateData(event: ConfigurationChangeEvent) {
    if (event.affectsConfiguration("Directories.PathToScripts")) {
        updateScripts();
    }
    return;
}

function onChange(change) {
    if (change.contentChanges.length !== 0) {
        createFileData();
    }
}

function createFileData() {
    if (!window.activeTextEditor) {
        return;
    }
    if (!window.activeTextEditor.document) {
        return;
    }
    if (window.activeTextEditor.document.languageId !== "ltx") {
        return;
    }

    try {
        let tempData = new LtxDocument(window.activeTextEditor.document);
        fileData = tempData;
        documents.set(window.activeTextEditor.document, tempData);
    }
    catch (error) {
        window.showErrorMessage('Error when parsing the '.concat(window.activeTextEditor.document.fileName));
        console.log(error);
        return;
    }

    diagnosticCollection.clear();
    if (isDiagnosticEnabled()) {
        let diagnosticMap: Map<string, Diagnostic[]> = new Map();
        workspace.textDocuments.forEach(document => {
            if (document.languageId !== "ltx") {
                return;
            }
            let errors;

            if (fileData) {
                errors = fileData.errorsData;
            }

            let canonicalFile = document.uri.toString();
            let diagnostics = diagnosticMap.get(canonicalFile);

            if (!diagnostics) {
                diagnostics = [];
            }
            errors.forEach(item => {
                diagnostics.push(new Diagnostic(item.range, item.descr));
            });
            diagnosticMap.set(canonicalFile, diagnostics);
        })

        diagnosticMap.forEach((diags, file) => {
            diagnosticCollection.set(Uri.parse(file), diags);
        });
    }
}

function getSemanticLtx() {
    const provider: DocumentSemanticTokensProvider = {
        provideDocumentSemanticTokens(document: TextDocument): ProviderResult<SemanticTokens> {
            const tokensBuilder = new SemanticTokensBuilder(legend);

            if (!documents.get(document)) {
                createFileData();
            }
            var data = documents.get(document);
            let temp = data.getSemanticData();
            temp.forEach(item => {
                let modification = [];
                if (item.modification) {
                    modification.push(item.modification);
                }

                tokensBuilder.push(item.range, item.type, modification);
            });

            return tokensBuilder.build();
        }
    };
    return provider;
}

export function deactivate() {
    return;
}

function getLogicFunctions(): CompletionItemProvider<CompletionItem> {
    return {
        provideCompletionItems(document: TextDocument) {
            if (!documents.get(document)) {
                createFileData();
            }
            var data = documents.get(document);
            const docs = require("../data/logic_documentation.json");
            let temp;

            if (!isInsideFunctionsGroup(data)) {
                return;
            }

            temp = getFunctions();
            return temp.map((element : string) => {
                let item = new CompletionItem(element, CompletionItemKind.Function)
                item.detail = "xr_effects." + element;
                if (docs[element]) {
                    let Mark = new MarkdownString(docs[element]['documentation']);
                    Mark.isTrusted = true;
                    Mark.supportHtml = true;
                    item.documentation = Mark;
                }
                return item;
            });
        }
    };
}

function getLogicConditions(): CompletionItemProvider<CompletionItem> {
    return {
        provideCompletionItems(document: TextDocument) {
            if (!documents.get(document)) {
                createFileData();
            }
            var data = documents.get(document);
            const docs = require("../data/logic_documentation.json");

            if (!isInsideConditionsGroup(data)) {
                return;
            }

            var temp = getConditions();
            return temp.map((element : string) => {
                let item = new CompletionItem(element, CompletionItemKind.Function)
                item.detail = "xr_conditions." + element;
                if (docs[element]) {
                    let Mark = new MarkdownString(docs[element]['documentation']);
                    Mark.isTrusted = true;
                    Mark.supportHtml = true;
                    item.documentation = Mark;
                }
                return item;
            });
        }
    };
}

function getOtherSections(): CompletionItemProvider<CompletionItem> {
    return {
        async provideCompletionItems(document: TextDocument) {
            if (!documents.get(document)) {
                createFileData();
            }
            var path = getPathToMisc();
            console.time('addSquad')
            var items = []
            var files = await workspace.findFiles('{' + path + 'squad_descr_*.ltx,' + path + 'squad_descr.ltx}');

            for await (const file of files) {
                let doc = await workspace.openTextDocument(file).then(doc => { return doc; });
                let ltxData = new LtxDocument(doc, ['fast']);
                var tempItems = []
                for await (const section of ltxData.getSectionsName()) {
                    tempItems.push(new CompletionItem(section, CompletionItemKind.Issue));
                }
                items = items.concat(tempItems);
            }
            console.timeEnd('addSquad')

            console.time('addTasks')
            files = await workspace.findFiles('{' + path + 'tm_*.ltx}');

            for await (const file of files) {
                let doc = await workspace.openTextDocument(file).then(doc => { return doc; });
                let ltxData = new LtxDocument(doc, ['fast']);
                var tempItems = []
                for await (const section of ltxData.getSectionsName()) {
                    tempItems.push(new CompletionItem(section, CompletionItemKind.Field));
                }
                items = items.concat(tempItems);
            }
            console.timeEnd('addTasks')

            return items;
        }
    };
}