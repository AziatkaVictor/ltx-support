import { Position, window } from "vscode";
import * as path from 'path';
import * as fs from 'fs';
import { LtxDocument } from "../ltx/ltxDocument";
import { getDefaultPathToConditions, getDefaultPathToFunctions, getPathToScripts } from "../settings";
import { getFileData } from "./fileReader";

var functionsData : string[];
var conditionsData : string[];
export var scriptFiles: string[] | null;
export var dirPath: string;

export function getFunctions() {
    console.time('getFunctions')
    if (!functionsData) {
        getLogicFunctionsLua();
    }
    console.timeEnd('getFunctions')
    return functionsData;
}

export function getConditions() {
    console.time('getConditions')
    if (!conditionsData) {
        getLogicConditionsLua();
    }
    console.timeEnd('getConditions')
    return conditionsData;
}

export function updateScripts() {
    console.time('updateScripts')
    readScriptDir();
    getLogicFunctionsLua();
    getLogicConditionsLua();
    console.timeEnd('updateScripts')
}

export function isInsideFunctionsGroup(file: LtxDocument): boolean {
    if (!window.activeTextEditor) {
        return false;
    }

    const sel = window.activeTextEditor.selection;
    const start = new Position(sel.start.line, sel.start.character - 1);
    var content = file.getLine(sel);

    if (!sel && !content) {
        return false;
    }
    
    let condlists = content.condlists
    for (let index = 0; index < condlists.length; index++) {
        const element = condlists[index];
        if (!element.functionRange) {
            continue;
        }
        if (element.functionRange.contains(start)) {
            return true;
        }
    }

    return false;
};

export function isInsideConditionsGroup(file: LtxDocument): boolean {
    if (!window.activeTextEditor) {
        return false;
    }

    const sel = window.activeTextEditor.selection;
    const start = new Position(sel.start.line, sel.start.character - 1);
    var content = file.getLine(sel);

    if (!sel && !content) {
        return false;
    }

    let condlists = content.condlists
    for (let index = 0; index < condlists.length; index++) {
        const element = condlists[index];
        if (!element.conditionRange) {
            continue;
        }
        if (element.conditionRange.contains(start)) {
            return true;
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
        functionsData = parseLua(filePath, path.resolve(__dirname, getDefaultPathToFunctions()));
    }
    else {
        if (dirPath && dirPath.trim() !== "") {
            window.showErrorMessage('Ошибка! Не удаётся найти файл: ' + dirPath + "\\xr_effects.script");
        }
        let filePath = path.resolve(__dirname, getDefaultPathToFunctions());
        functionsData = parseLua(filePath);
    }
}

export function getLogicConditionsLua() {
    if (!scriptFiles) {
        readScriptDir();
    }

    if (scriptFiles.indexOf("xr_conditions.script") !== -1) {
        let filePath = path.resolve(dirPath, "./xr_conditions.script");
        conditionsData = parseLua(filePath, path.resolve(__dirname, getDefaultPathToConditions()));
    }
    else {
        if (dirPath && dirPath.trim() !== "") {
            window.showErrorMessage('Ошибка! Не удаётся найти файл: ' + dirPath + "\\xr_conditions.script");
        }
        let filePath = path.resolve(__dirname, getDefaultPathToConditions());
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
        let file = getFileData(filePath);
        if (!file) {
            throw new Error("File is null: " + filePath);
        }
        
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
    catch (error) {
        console.log(error);
        if (secondFilePath) {
            parseLua(secondFilePath);
        }
    }
}
