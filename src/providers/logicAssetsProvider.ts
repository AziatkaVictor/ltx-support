import * as fs from 'fs';
import * as path from 'path';
import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, Position, TextDocument, workspace } from "vscode";
import { getLtxDocument } from "../extension";
import { LtxDocument, LtxDocumentType } from "../ltx/ltxDocument";
import { getDefaultPathToLocalization, getIgnoredLocalization, getPathToLocalization, getPathToMisc, isIgnoreDialogs, isIgnoreQuests } from "../settings";
import { getXmlData } from "../utils/fileReader";

export async function provideLogicAssets(document: TextDocument, position: Position, token?: CancellationToken, context?: CompletionContext): Promise<CompletionItem[] | undefined> {
    var data = getLtxDocument(document);
    var items = [];
    
    if (data.isInsideArgumentsGroup(position)) {
        items = items.concat(await getSquads(document));
        items = items.concat(await getTasks(document));
    }
    if (data.isInsideArgumentsGroup(position) || (!data.isInsideCondition(position) && !data.isInsideFunction(position) && data.inInsideCondlist(position))) {
        if (data.getLine(position).getType() === "cfg_get_bool" || null) {
            items = items.concat(await getKeywords(data));            
        }
        if (data.getLine(position).getType() === "cfg_get_string" || null) {
            items = items.concat(await getLocalization());            
        }
    }
    if (data.isInsideSignal(position)) {
        items = items.concat(await getSignals());
    }
    return items;
}

async function getSquads(document: TextDocument) : Promise<CompletionItem[]> {
    var items = [];
    var files = await workspace.findFiles('{' + getPathToMisc() + 'squad_descr_*.ltx,' + getPathToMisc() + 'squad_descr.ltx}', document.uri.fsPath);
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
    var files = await workspace.findFiles('{' + getPathToMisc() + 'tm_*.ltx}', document.uri.fsPath);
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
    return (await getLocalizationData()).map(value => {
        let item = new CompletionItem(value.$.id, CompletionItemKind.Variable);
        item.documentation = value.text[0];
        item.detail = "Localization"
        return item;
    });
}

async function getLocalizationData() {
    var user = (await workspace.findFiles(getPathToLocalization() + '*.xml')).map(value => {return value.fsPath.split("\\")[value.fsPath.split("\\").length - 1]});
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
            result = result.concat(getXmlData(path.resolve(file)))
        }
        else {
            // result = result.concat(parseXML(path.resolve(__dirname, getDefaultPathToLocalization(), fileName)))
        }
    }   
    return Array.from(new Set(result));
}

async function getSignals() {
    return ["test1", "test2"].map(value => {
        let item = new CompletionItem(value, CompletionItemKind.Constant);
        item.detail = "Signal"
        return item;
    });
}