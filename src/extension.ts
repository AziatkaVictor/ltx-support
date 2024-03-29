import { commands, ConfigurationChangeEvent, Diagnostic, DiagnosticCollection, ExtensionContext, languages, TextDocument, window, workspace } from 'vscode';
import { addDocumentation, startGame } from './commands';
import { LtxDocument } from "./ltx/ltxDocument";
import { updateScripts } from './utils/actionsParser';
import { provideFolding } from './providers/FoldingProvider';
import { provideHover } from './providers/HoverProvider';
import { legend, provideLogicSemantic } from './providers/SemanticProvider';
import { provideSymbols } from './providers/SymbolsProvider';
import { isUpdateDocumentation, isDiagnosticEnabled} from './settings';
import { provideCompletion } from './providers/CompletionItemProvider';
import { updateDocumentation } from './documentation';
import { provideCodeActions } from './providers/CodeActionsProvider';

export var diagnosticCollection: DiagnosticCollection;
export var diagnosticMap: Map<string, Diagnostic[]> = new Map();
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

    context.subscriptions.push(languages.registerCompletionItemProvider("ltx", {provideCompletionItems : provideCompletion}, "[", "!", "=", "+", "-", ":", "("));    
    context.subscriptions.push(languages.registerFoldingRangeProvider("ltx", {provideFoldingRanges : provideFolding}));
    context.subscriptions.push(languages.registerDocumentSymbolProvider("ltx", {provideDocumentSymbols : provideSymbols}));    
    context.subscriptions.push(languages.registerDocumentSemanticTokensProvider("ltx", {provideDocumentSemanticTokens : provideLogicSemantic}, legend));
    context.subscriptions.push(languages.registerHoverProvider("ltx", {provideHover : provideHover}));
    context.subscriptions.push(languages.registerCodeActionsProvider("ltx", {provideCodeActions : provideCodeActions}));

    context.subscriptions.push(commands.registerCommand("ltx-support.addDocumentation", addDocumentation));
    context.subscriptions.push(commands.registerCommand("ltx-support.Start", startGame));
    context.subscriptions.push(commands.registerCommand("ltx-support.updateScripts", updateScripts));
    context.subscriptions.push(commands.registerCommand("ltx-support.updateDocumentation", updateDocumentation));

    if (isUpdateDocumentation()) {
        updateDocumentation();
    }

    window.showInformationMessage("LTX Support запущено! Возникли сложности или хочешь знать как работает логика сталкера? Загляни на [Wiki](https://github.com/AziatkaVictor/ltx-support/wiki)!", "Спасибо!");
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
    
    if (!isDiagnosticEnabled()) {
        diagnosticCollection.clear();        
    }
}

export function deactivate() {
    return;
}