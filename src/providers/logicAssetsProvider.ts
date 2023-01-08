import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, Position, TextDocument } from "vscode";
import { getLtxDocument } from "../extension";
import { LtxDocument } from "../ltx/ltxDocument";
import { findFilesInWorkspace } from "../lua/fileReader";
import { getPathToMisc } from "../settings";

export async function provideLogicAssets(document: TextDocument, position: Position, token?: CancellationToken, context?: CompletionContext): Promise<CompletionItem[] | undefined> {
    var data = getLtxDocument(document);
    var items = [];
    if (data.isInsideConditionGroup(position) || data.isInsideFunctionGroup(position)) {
        items = items.concat(await getSquads(document));
        items = items.concat(await getTasks(document));
    }
    return items;
}

async function getSquads(document: TextDocument) : Promise<CompletionItem[]> {
    var items = [];
    var files = await findFilesInWorkspace('{' + getPathToMisc() + 'squad_descr_*.ltx,' + getPathToMisc() + 'squad_descr.ltx}', document);
    for await (const file of files) {
        var items = [];
        for await (const section of await LtxDocument.prototype.getSectionsByUri(file)) {
            items.push(new CompletionItem(section, CompletionItemKind.User));
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
            items.push(new CompletionItem(section, CompletionItemKind.Event));
        }
    }
    return items;
}