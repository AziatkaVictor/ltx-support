import { readdirSync } from 'fs';
import { commands, ConfigurationChangeEvent, Diagnostic, DiagnosticCollection, ExtensionContext, languages, QuickPickItem, TextDocument, Uri, window, workspace } from 'vscode';
import { LtxDocument } from "./ltx/ltxDocument";
import { updateScripts } from './lua/actionsParser';
import { addActionsDocumentnation, provideLogicActions } from './providers/logicActionsProvider';
import { provideLogicAssets } from './providers/logicAssetsProvider';
import { provideFolding } from './providers/logicFoldingProvider';
import { provideHover } from './providers/logicHoverProvider';
import { provideLogicInfo } from './providers/logicInfoProvider';
import { provideLogicParams } from './providers/logicParamsProvider';
import { provideLogicSections } from './providers/logicSectionsProvider';
import { legend, provideLogicSemantic } from './providers/logicSemanticProvider';
import { provideSymbols } from './providers/logicSymbolsProvider';
import { isUseWorkspaceFolder, isDiagnosticEnabled, getAdditiveCommands, getGameCommands, getGamePath } from './settings';

let diagnosticCollection: DiagnosticCollection;
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
    context.subscriptions.push(languages.registerCompletionItemProvider("ltx", {provideCompletionItems : provideLogicAssets}, "(", ":"));
    context.subscriptions.push(languages.registerCompletionItemProvider("ltx", {provideCompletionItems : provideLogicSections}, "[")); 
    context.subscriptions.push(languages.registerCompletionItemProvider("ltx", {provideCompletionItems : provideLogicParams}));
    
    context.subscriptions.push(languages.registerFoldingRangeProvider("ltx", {provideFoldingRanges : provideFolding}));
    context.subscriptions.push(languages.registerDocumentSymbolProvider("ltx", {provideDocumentSymbols : provideSymbols}));
    
    context.subscriptions.push(languages.registerDocumentSemanticTokensProvider("ltx", {provideDocumentSemanticTokens : provideLogicSemantic}, legend));
    context.subscriptions.push(languages.registerHoverProvider("ltx", {provideHover : provideHover}));
    
    context.subscriptions.push(commands.registerCommand("ltx-support.addDocumentation", addActionsDocumentnation));
    context.subscriptions.push(commands.registerCommand("ltx-support.Start", startGame));

    window.showInformationMessage("LTX Support запущено! Возникли сложности или вы просто хотите больше знать о том, как работает логика сталкера? Загляните на [Wiki](https://github.com/AziatkaVictor/ltx-support/wiki)!", "Спасибо!");
}

async function startGame() {
    class gameStartChoise implements QuickPickItem {
        constructor(public label : string, public detail : string) {
        }
    }

    var choise = await window.showQuickPick(getGameCommands().map((value) => {return new gameStartChoise(value[0], value[1])}));
    if (!choise) {
        return;
    }

    var terminal = window.activeTerminal ? window.activeTerminal : window.createTerminal();
    terminal.show();

    if (isUseWorkspaceFolder()) {
        terminal.sendText("cd '" + workspace.workspaceFolders[0].uri.fsPath + "'");   
        terminal.sendText(getAdditiveCommands());
    }
    else {
        terminal.sendText("cd '" + getGamePath() + "'");
    }

    terminal.sendText(choise.detail);
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
    if (!window.activeTextEditor) return;
    if (!window.activeTextEditor.document) return;
    if (window.activeTextEditor.document.languageId !== "ltx") return;

    try {
        documents.set(window.activeTextEditor.document, new LtxDocument(window.activeTextEditor.document));
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
            var errors = getLtxDocument(document).errorsData;
            let canonicalFile = document.uri.toString();
            let diagnostics = diagnosticMap.get(canonicalFile);

            if (!diagnostics) {
                diagnostics = [];
            }
            errors.forEach(item => {
                let diagnosticItem = new Diagnostic(item.range, item.descr, item.errorType);
                diagnosticItem.code = item.tag;
                diagnostics.push(diagnosticItem);
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