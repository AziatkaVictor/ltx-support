import { getDefaultPathToScripts, getPathToScripts } from "../settings";
import { analyzeFile, findElements} from "./fileReader";

var functionsData : string[];
var conditionsData : string[];

export function getFunctions() {
    console.time('getFunctions')
    if (!functionsData) {
        updateFunctions();
    }
    console.timeEnd('getFunctions')
    return functionsData;
}

export function getConditions() {
    console.time('getConditions')
    if (!conditionsData) {
        updateConditions();
    }
    console.timeEnd('getConditions')
    return conditionsData;
}

export async function updateScripts() {
    console.time('updateScripts')
    updateFunctions();
    updateConditions();
    console.timeEnd('updateScripts')
}

function updateFunctions() {
    functionsData = analyzeFile("xr_effects.script", getPathToScripts(), getDefaultPathToScripts(), findFunctions);
}

function updateConditions() {
    conditionsData = analyzeFile("xr_conditions.script", getPathToScripts(), getDefaultPathToScripts(), findFunctions);
}

function findFunctions(filePath: string) {
    return findElements(filePath, /(?<=^function\s).+?(?=\(.*?\))/gm, (match) => {return match[0]});
}
