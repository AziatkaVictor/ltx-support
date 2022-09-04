import { window } from "vscode";
import * as fs from 'fs';
import * as path from 'path';
import { LtxDocument } from "./parseLtx";
import { getPathToScripts } from "./utils";

var functionsData;
var conditionsData;
var scriptFiles: string[] | null;
var dirPath;

export function getFunctions() {
    if (!functionsData) {
        getLogicFunctionsLua();
    }
    return functionsData;
}

export function getConditions() {
    if (!conditionsData) {
        getLogicConditionsLua();
    }
    return conditionsData;
}

export function updateScripts() {
    readScriptDir();
    getLogicFunctionsLua();
    getLogicConditionsLua();
}

export function isInsideFunctionsGroup(file: LtxDocument): boolean {
    if (!window.activeTextEditor) {
        return false;
    }

    const sel = window.activeTextEditor.selection;
    var content = file.getLine(sel);

    if (sel && content) {
        let condlists = content.condlists
        for (let index = 0; index < condlists.length; index++) {
            const element = condlists[index];
            if (element.functionRange) {
                if (element.functionRange.contains(sel.start)) {
                    return true;
                }
            }
        }
    }
    return false;
};

export function isInsideConditionsGroup(file: LtxDocument): boolean {
    if (!window.activeTextEditor) {
        return false;
    }

    const sel = window.activeTextEditor.selection;
    var content = file.getLine(sel);

    if (sel && content) {
        let condlists = content.condlists
        for (let index = 0; index < condlists.length; index++) {
            const element = condlists[index];
            if (element.conditionRange) {
                if (element.conditionRange.contains(sel.start)) {
                    return true;
                }
            }
        }
    }
    return false;
}

export function getLogicFunctionsLua() {
    if (!scriptFiles) {
        readScriptDir();
    }

    if (scriptFiles.indexOf("xr_effects.script") !== -1) {
        let filePath = path.resolve(dirPath, "./xr_effects.script");
        functionsData = parseLua(filePath, path.resolve(__dirname, "../data/xr_effects.script"));
    }
    else {
        if (dirPath && dirPath.trim() !== "") {
            window.showErrorMessage('Ошибка! Не удаётся найти файл: ' + dirPath + "\\xr_effects.script");
        }
        let filePath = path.resolve(__dirname, "../data/xr_effects.script");
        functionsData = parseLua(filePath);
    }
}

export function getLogicConditionsLua() {
    if (!scriptFiles) {
        readScriptDir();
    }

    if (scriptFiles.indexOf("xr_conditions.script") !== -1) {
        let filePath = path.resolve(dirPath, "./xr_conditions.script");
        conditionsData = parseLua(filePath, path.resolve(__dirname, "../data/xr_conditions.script"));
    }
    else {
        if (dirPath && dirPath.trim() !== "") {
            window.showErrorMessage('Ошибка! Не удаётся найти файл: ' + dirPath + "\\xr_conditions.script");
        }
        let filePath = path.resolve(__dirname, "../data/xr_conditions.script");
        conditionsData = parseLua(filePath);
    }
}

export function readScriptDir() {
    dirPath = getPathToScripts();

    try {
        scriptFiles = fs.readdirSync(dirPath);
    }
    catch {
        scriptFiles = [];
    }
}

function parseLua(filePath: string, secondFilePath?: string) {
    try {
        let file = fs.readFileSync(filePath, "utf8");
        if (file) {
            let arr: string[] = file.replace(/--\[\[((.|\n)*?)\]\]/g, "").replace(/--.*(?=\n)/g, "").split("\n");
            let func_arr = [];
            arr.forEach(element => {
                let re: RegExp = /(?<=^function\s).*?(?=\(.*?\))/m;
                let text = re.exec(element.trim() + '\n');
                if (text) {
                    func_arr.push(text[0]);
                }
            });
            return func_arr;
        }
        else {
            throw new Error("File is null: " + filePath);
        }
    }
    catch (error) {
        console.log(error);
        if (secondFilePath) {
            parseLua(secondFilePath);
        }
    }
}
