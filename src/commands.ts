import { QuickPickItem, window, workspace } from "vscode";
import { getGameCommands, isUseWorkspaceFolder, getAdditiveCommands, getGamePath } from "./settings";


export async function startGame() {
    class gameStartChoise implements QuickPickItem {
        constructor(public label : string, public detail : string) {
        }
    }

    var options = getGameCommands();
    if (!options) {
        return;
    }

    var choise = await window.showQuickPick(options.map((value) => {return new gameStartChoise(value[0], value[1])}));
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