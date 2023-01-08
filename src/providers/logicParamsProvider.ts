import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, Position, TextDocument } from "vscode";
import { getLtxDocument } from "../extension";
import { LtxDocument } from "../ltx/ltxDocument";

export async function provideLogicParams(document: TextDocument, position: Position, token?: CancellationToken, context?: CompletionContext): Promise<CompletionItem[] | undefined> {
    var data = getLtxDocument(document);
    if (data.getSectionByPosition(position) && !data.getLine(position).inInsideCondlist(position)) {
        return await getParams(data, position);
    }
}

async function getParams(data: LtxDocument, position : Position) {
    return Array.from(new Set(data.getSectionByPosition(position).type.getParams())).map((item) => {return new CompletionItem(item, CompletionItemKind.Enum);})
}