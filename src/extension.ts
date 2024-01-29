import { ConfigurationChangeEvent, ExtensionContext, languages, window, workspace } from 'vscode';
import { DocumentsManager } from './classes/ltx';
import { updateDocumentation } from './documentation';
import { CustomFoldingRangeProvider } from "./providers/Index";
import { isUpdateDocumentation } from './settings';
import { updateScripts } from './utils/actionsParser';

export function activate(context: ExtensionContext) {
    var manager = new DocumentsManager();

    workspace.onDidChangeConfiguration(updateData);

    var providers = [
        languages.registerFoldingRangeProvider("ltx", new CustomFoldingRangeProvider(manager))
    ];

    context.subscriptions.push(...providers);

    if (isUpdateDocumentation()) {
        updateDocumentation();
    }

    window.showInformationMessage("LTX Support запущено! Возникли сложности или хочешь знать как работает логика сталкера? Загляни на [Wiki](https://github.com/AziatkaVictor/ltx-support/wiki)!", "Спасибо!");
}

function updateData(event: ConfigurationChangeEvent) {
    if (event.affectsConfiguration("Directories.PathToScripts")) {
        updateScripts();
    }
}

export function deactivate() {
    return;
}