import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, Position, TextDocument } from "vscode";
import { getDocumentation, DocumentationKind } from "../documentation";
import { getLtxDocument } from "../extension";
import { LtxDocument, LtxDocumentType } from "../ltx/ltxDocument";
import { getParamsByFile } from "../lua/modulesParser";

export async function provideLogicParams(document: TextDocument, position: Position, token?: CancellationToken, context?: CompletionContext): Promise<CompletionItem[] | undefined> {
    var data = getLtxDocument(document);
    if (data.getSectionByPosition(position) && !data.getLine(position).inInsideCondlist(position)) {
        return await getParams(data, position);
    }
}

async function getParams(data: LtxDocument, position : Position) {
    var items = data.getType() !== LtxDocumentType.Logic ? getParamsByFile(data.getType()).map((value) => {return value.split(":")[1]}) : data.getSectionByPosition(position).type.getParams();
    return Array.from(new Set(items)).map((value) => {
        var item = new CompletionItem(value, CompletionItemKind.Enum);
        var Mark = getDocumentation(value, DocumentationKind.Property);
        item.documentation = Mark;
        return item; 
    })
}