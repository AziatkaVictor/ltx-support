import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, Position, TextDocument, workspace } from "vscode";
import { getLtxDocument } from "../extension";
import { LtxDocument, LtxDocumentType } from "../ltx/ltxDocument";
import { findFilesInWorkspace } from "../lua/fileReader";
import { getDefaultPathToLocalization, getIgnoredLocalization, getPathToLocalization, getPathToMisc, isIgnoreDialogs, isIgnoreQuests } from "../settings";
import { parseString } from 'xml2js';
import * as fs from 'fs';
import * as path from 'path';

export async function provideLogicAssets(document: TextDocument, position: Position, token?: CancellationToken, context?: CompletionContext): Promise<CompletionItem[] | undefined> {
    var data = getLtxDocument(document);
    var items = [];
    
    if (data.isInsideArgumentsGroup(position)) {
        items = items.concat(await getSquads(document));
        items = items.concat(await getTasks(document));
    }
    if (data.isInsideArgumentsGroup(position) || (!data.isInsideConditionGroup(position) && !data.isInsideFunctionGroup(position))) {
        items = items.concat(await getKeywords(data));
        items = items.concat(await getLocalization());
    }
    return items;
}

async function getSquads(document: TextDocument) : Promise<CompletionItem[]> {
    var items = [];
    var files = await findFilesInWorkspace('{' + getPathToMisc() + 'squad_descr_*.ltx,' + getPathToMisc() + 'squad_descr.ltx}', document);
    for await (const file of files) {
        var items = [];
        for await (const section of await LtxDocument.prototype.getSectionsByUri(file)) {
            var item = new CompletionItem(section, CompletionItemKind.User);
            item.detail = "Squad"
            items.push(item);
        }
    }
    return items;
}

async function getTasks(document: TextDocument) : Promise<CompletionItem[]> {
    var items = [];
    var files = await findFilesInWorkspace('{' + getPathToMisc() + 'tm_*.ltx}', document);
    for await (const file of files) {
        let ltxData =  await LtxDocument.prototype.getSectionsByUri(file);
        for await (const section of ltxData) {
            var item = new CompletionItem(section, CompletionItemKind.Event);
            item.detail = "Task"
            items.push(item);
        }
    }
    return items;
}

async function getKeywords(document : LtxDocument): Promise<CompletionItem[]> {
    var items = ["nil","true","false"];
    if (document.getType() === LtxDocumentType.Tasks) {
        items.push("complete", "fail", "reversed");
    }
    return items.map((value) => {
        var item = new CompletionItem(value, CompletionItemKind.Keyword);
        return item;
    })
}

async function getLocalization(): Promise<CompletionItem[]> {
    var result = (await getLocalizationArr()).map(value => {
        let item = new CompletionItem(value.$.id, CompletionItemKind.Variable);
        item.documentation = value.text[0];
        item.detail = "Localization"
        return item;
    });

    return result;
}

async function getLocalizationArr() {
    var user = (await findFilesInWorkspace(getPathToLocalization() + '*.xml')).map(value => {return value.fsPath.split("\\")[value.fsPath.split("\\").length - 1]});
    var storage = fs.readdirSync(path.resolve(__dirname, getDefaultPathToLocalization()));
    var files = Array.from(new Set(storage.concat(user)));
    var result = [];

    for await (let fileName of files) {
        if ((isIgnoreDialogs() && fileName.indexOf("st_dialog") !== -1) || (isIgnoreQuests() && fileName.indexOf("st_quest") !== -1) || getIgnoredLocalization().indexOf(fileName) !== -1) {
            continue;
        }
        let file = (workspace.workspaceFolders[0].uri.path + "/" + getPathToLocalization() + fileName).replace(/\//g, "\\");    
        file = file.slice(1, file.length);
       
        if (fs.existsSync(file)) {
            result = result.concat(parseXML(path.resolve(file)))
        }
        else {
            // result = result.concat(parseXML(path.resolve(__dirname, getDefaultPathToLocalization(), fileName)))
        }
    }   
    return Array.from(new Set(result));
}

function parseXML(file: string): CompletionItem[]|null {
    const Iconv = require('iconv').Iconv;
    const iconv = new Iconv('cp1251', 'UTF-8');
    let value = fs.readFileSync(file);
    value = iconv.convert(value);
    let text = String(value).replace("\"#$&'()*+-./:;<=>?@[]^_`{|}~", "");
    let data;
    parseString(text, function (err, result) {
        if (err) {
            console.log(file);
            console.log('There was an error when parsing: ' + err);
        }
        else {
            data = result;
        }
    });
    return data.string_table.string ? data.string_table.string : null;
}