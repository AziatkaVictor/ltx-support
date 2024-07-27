import { ConfigurationChangeEvent, ExtensionContext, TextDocumentChangeEvent, languages, window, workspace, commands, TextDocument } from 'vscode';
import { Document, DocumentFactory, DocumentsManager, LogicDocument, TasksDocument } from './classes/ltx';
import { updateDocumentation } from './documentation';
import { CustomCompletionProvider, CustomFoldingRangeProvider } from "./providers/Index";
import { isUpdateDocumentation } from './settings';
import { updateScripts } from './utils/actionsParser';

export function activate(context: ExtensionContext) {
    // Register Documents classes
    const documentsFactory = DocumentFactory.instance;

    documentsFactory.register('logic', {condition: LogicDocument.canBeCreated, classToCreate: LogicDocument});
    documentsFactory.register('task', {condition: TasksDocument.canBeCreated, classToCreate: TasksDocument});

    commands.registerCommand('extension/getDirectory', async function() {
        return context;
    });
    
    // Update data after changing settings
    workspace.onDidChangeConfiguration((change: ConfigurationChangeEvent) => {
        if (change.affectsConfiguration("Directories.PathToScripts")) {
            updateScripts();
        }
    });

    // Update document data after changing text inside it
    workspace.onDidChangeTextDocument((change: TextDocumentChangeEvent) => {
        if (!change.contentChanges) return;
        DocumentsManager.instance.set(change.document);
    });

    // Registered custom LTX providers
    var providers = [
        languages.registerFoldingRangeProvider("ltx", new CustomFoldingRangeProvider(DocumentsManager.instance)),
        languages.registerCompletionItemProvider("ltx", new CustomCompletionProvider(DocumentsManager.instance), "[", "%", "=", "!", "(", ":")
    ];

    context.subscriptions.push(...providers);

    // Update documentation on every start of VSCode
    if (isUpdateDocumentation()) {
        updateDocumentation();
    }

    window.showInformationMessage("LTX Support запущено! Возникли сложности или хочешь знать как работает логика сталкера? Загляни на [Wiki](https://github.com/AziatkaVictor/ltx-support/wiki)!", "Спасибо!");
}

export function deactivate() {
    return;
}