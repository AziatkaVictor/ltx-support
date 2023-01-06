import * as fs from 'fs';
import * as path from 'path';

export function getFileData(filePath : string) {
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, "utf8");
    }
    return;
}

export function removeLuaComments(file : string) : string {
    return file.replace(/--\[\[((.|\n)*?)\]\]/g, "").replace(/--.*(?=$)/gm, "");
}

export function analyzeFile(fileStorage : string[], fileName : string, firstPath : string, secondPath : string, callback : (path : string) => string[]) : string[] {
    var data = [];
    if (fileStorage.indexOf(fileName) !== -1 && firstPath) {
        data = callback(path.resolve(firstPath, "./" + fileName));
    }
    else {
        data = callback(path.resolve(__dirname, secondPath + "./" + fileName));
    }
    return data;
}

export function getClearLuaFile(filePath : string) {
    let file = getFileData(filePath);
    if (!file) {
        throw new Error("File is null: " + filePath);
    }
    return removeLuaComments(file);
}

export function findElements(filePath : string, re : RegExp, callback : (match) => string, removeSame : boolean = true) {
    var text = getClearLuaFile(filePath);
    var match;
    var data = [];
    while ((match = re.exec(text)) !== null) {
        data.push(callback(match));
    }

    if (removeSame) {
        return Array.from(new Set(data));
    }
    return data;
}