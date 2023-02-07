import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, Position, TextDocument } from "vscode";
import { getLtxDocument } from "../extension";
import { LtxDocument, LtxDocumentType } from "../ltx/ltxDocument";
import { findFilesInWorkspace } from "../lua/fileReader";
import { getPathToMisc } from "../settings";

export async function provideLogicAssets(document: TextDocument, position: Position, token?: CancellationToken, context?: CompletionContext): Promise<CompletionItem[] | undefined> {
    var data = getLtxDocument(document);
    var items = [];
    
    if (data.isInsideArgumentsGroup(position)) {
        items = items.concat(await getSquads(document));
        items = items.concat(await getTasks(document));
    }
    if (data.isInsideArgumentsGroup(position) || (!data.isInsideConditionGroup(position) && !data.isInsideFunctionGroup(position))) {
        items = items.concat(await getKeywords(data));
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
