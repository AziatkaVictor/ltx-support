import * as fs from 'fs';
import * as path from 'path';
import { GlobPattern, TextDocument, Uri, workspace } from 'vscode';

export function getFileData(filePath : string) {
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, "utf8");
    }
    return;
}

export function removeLuaComments(file : string) : string {
    return file.replace(/--\[\[((.|\n)*?)\]\]/g, "").replace(/--.*(?=$)/gm, "");
}

export function analyzeFile(fileName : string, firstPath : string, secondPath : string, callback : (path : string) => string[]) : string[] {
    var item = (workspace.workspaceFolders[0].uri.path + "/" + firstPath + fileName).replace(/\//g, "\\");
    item = item.slice(1, item.length);
        
    if (fs.existsSync(item)) {
        return callback(path.resolve(item));
    }
    else {
        return callback(path.resolve(__dirname, secondPath + "./" + fileName));
    }
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

export async function findFilesInWorkspace(pattern : GlobPattern, document?: TextDocument) : Promise<Uri[]> { 
    if (document) {
        return await workspace.findFiles(pattern, document.uri.fsPath);
    }
    return await workspace.findFiles(pattern);
} 