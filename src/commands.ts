import { QuickPickItem, window, workspace } from "vscode";
import { addFunctionDocumentnation } from "./documentation";
import { getGameCommands, isUseWorkspaceFolder, getAdditiveCommands, getGamePath } from "./settings";

const TYPES = new Map<string, Function>([["Functions", addFunctionDocumentnation]]);

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

export async function addDocumentation() {
    try {
        var type = await pickType();
        if (type) {
            await TYPES.get(type)();
        }        
    } catch (error) {
        console.log(error);
    }
}

async function pickType() {
    var type = await window.showQuickPick(Array.from(TYPES.keys()));
    if (!type) {
        window.showErrorMessage("Операция прервана. Не был выбран тип.")
        throw new Error("Type is not picked!");      
    }
    return type;
}