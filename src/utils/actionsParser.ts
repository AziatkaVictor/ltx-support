import { getDefaultPathToScripts, getPathToScripts } from "../settings";
import { analyzeFile, findLuaElements } from "./fileReader";
import { similarity } from "./modulesParser";

var functionsData: string[];
var conditionsData: string[];

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

export function getSimilarAction(name: string, count = 3, isCondition = true) {
    var data = (isCondition ? getConditions() : getFunctions()).map(item => {
        return {"name" : item, "value" : similarity(item, name)}
    });
    return data.sort((a, b) => b.value - a.value).slice(0, count);
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
    return findLuaElements(filePath, /(?<=^function\s).+?(?=\(.*?\))/gm, (match) => { return match[0].trim() });
}
