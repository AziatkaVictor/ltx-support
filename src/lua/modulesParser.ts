import { getDefaultPathToScripts, getPathToScripts } from "../settings";
import { analyzeFile, findLuaElements} from "./fileReader";

var modulesData : string[];
var sectionsData : Map<string, string[]> = new Map<string, string[]>();
var notExistedFiles : string [] = [];
var basedConditions : string[] = [];

export function getParameterType(paramName, sectionName) : string {
    for (const param of getParamsData(sectionName)) {
        if (param.indexOf(paramName) !== -1) {
            return param.split(":")[0];
        }
    }
}

function getParamsData(sectionName : string) {
    if (sectionsData.size === 0) {
        getSectionsData()
    }
    if (notExistedFiles.length === 0) {
        console.log(notExistedFiles);
    }

    return sectionsData.get(sectionName).concat(basedConditions);
}

export function getParams(sectionName : string) : string[] {
    return getParamsData(sectionName).map((value) => {return value.split(":")[1]});
}

/**
 * Получить список модулей в форме `Cекции`:`Cкрипт`. Необходимо скорее для парсинга файлов, чем для обычного использования.
 * @returns
 */
export function getModules() : string[] {
    if (!modulesData) {
        updateModules();
    }
    return modulesData.concat("logic:xr_logic.script");
}

function updateModules() {
    modulesData = Array.from(new Set(analyzeFile("modules.script", getPathToScripts(), getDefaultPathToScripts(), findModulesFileNames)));
}

function getSectionsData() { 
    let modules = getModules();
    // Получаем список параметров для каждого типа секций логики
    for (let index = 0; index < modules.length; index++) {
        const data = modules[index].split(':');
        var fileData = analyzeFile(data[1], getPathToScripts(), getDefaultPathToScripts(), findSectionParamsInFile);
        if (!fileData) {
            continue;
        }
        sectionsData.set(data[0], fileData);        
    }

    // Получаем базовые параметры секций, которые если у любого типа (например on_info)
    basedConditions = analyzeFile("xr_logic.script", getPathToScripts(), getDefaultPathToScripts(), findBasedConditions)
}

function findModulesFileNames(filePath : string) {
    return findLuaElements(filePath, /(?<=load_scheme\().+(?=\))/g, (match) => {
        let data = match[0].split(",");
        let fileNameItem = data[0].trim();
        let sectionNameItem = data[1].trim();
        return sectionNameItem.slice(1, sectionNameItem.length - 1) + ":" + fileNameItem.slice(1, fileNameItem.length - 1) + ".script";
    })
}

function findSectionParamsInFile(filePath : string) : string[] | null {
    return findLuaElements(filePath, /(utils\.(cfg_get_.+?))(\(.+?((?<=\")\w+(?=\")).+?\))/g, (match) => {
        return match[2].trim() + ":" + match[4];
    })
}

function findBasedConditions(filePath : string) {
    return findLuaElements(filePath, /(?<!function\sadd_conditions\()(?<=(add_conditions\()).+?(?=\))/g, (match) => {
        
        var type = match[0].split(",")[0].trim();
        var item = match[0].split(",")[1].trim();
        return type + ":" + item.slice(1, item.length - 1);
    })
}

