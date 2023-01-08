import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, Position, TextDocument } from "vscode";
import { getLtxDocument } from "../extension";
import { LtxDocument } from "../ltx/ltxDocument";

export async function provideLogicInfo(document: TextDocument, position: Position, token?: CancellationToken, context?: CompletionContext): Promise<CompletionItem[] | undefined> {
    var data = getLtxDocument(document);
    if (data.isInsideConditionGroup(position) || data.isInsideFunctionGroup(position)) {
        return await getInfos(data);
    }
}

async function getInfos(data: LtxDocument) : Promise<CompletionItem[]> {
    return Array.from(new Set(data.getInfos())).map((item) => {return new CompletionItem(item, CompletionItemKind.Constant);})
}