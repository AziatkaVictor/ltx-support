import { workspace, ExtensionContext, languages, window, TextDocument, ProviderResult, SemanticTokensLegend, SemanticTokens, SemanticTokensBuilder, Uri, DiagnosticCollection, Diagnostic, ConfigurationChangeEvent } from 'vscode';
import { LtxDocument } from "./ltx/ltxDocument";
import { updateScripts } from './lua/actionsParser';
import { provideLogicActions } from './providers/logicActionsProvider';
import { isDiagnosticEnabled } from './settings';
import { provideLogicInfo } from './providers/logicInfoProvider';
import { provideLogicParams } from './providers/logicParamsProvider';
import { provideLogicAssets } from './providers/logicAssetsProvider';
import { provideLogicSections } from './providers/logicSectionsProvider';
import { legend, provideLogicSemantic } from './providers/logicSemanticProvider';

let diagnosticCollection: DiagnosticCollection;
let fileData: LtxDocument;
export var documents: Map<TextDocument, LtxDocument> = new Map<TextDocument, LtxDocument>();

export function getLtxDocument(document : TextDocument) {
    if (!documents.get(document)) {
        createFileData();
    }
    return documents.get(document);
}

export function activate(context: ExtensionContext) {
    diagnosticCollection = languages.createDiagnosticCollection("ltx");

    workspace.onDidChangeTextDocument(onChange);
    workspace.onDidOpenTextDocument(createFileData);
    window.onDidChangeActiveTextEditor(createFileData);
    workspace.onDidChangeConfiguration(updateData);

    context.subscriptions.push(languages.registerCompletionItemProvider("ltx", {provideCompletionItems : provideLogicActions}, '=', "!"));
    context.subscriptions.push(languages.registerCompletionItemProvider("ltx", {provideCompletionItems : provideLogicInfo}, '-', '+'));
    context.subscriptions.push(languages.registerCompletionItemProvider("ltx", {provideCompletionItems : provideLogicParams}));
    context.subscriptions.push(languages.registerCompletionItemProvider("ltx", {provideCompletionItems : provideLogicAssets}));
    context.subscriptions.push(languages.registerCompletionItemProvider("ltx", {provideCompletionItems : provideLogicSections}, "["));

    context.subscriptions.push(languages.registerDocumentSemanticTokensProvider("ltx", {provideDocumentSemanticTokens : provideLogicSemantic}, legend));

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

export function deactivate() {
    return;
}