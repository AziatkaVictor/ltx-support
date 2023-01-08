import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, Position, TextDocument } from "vscode";
import { getLtxDocument } from "../extension";
import { LtxDocument } from "../ltx/ltxDocument";

export async function provideLogicSections(document: TextDocument, position: Position, token?: CancellationToken, context?: CompletionContext): Promise<CompletionItem[] | undefined> {
    var data = getLtxDocument(document);
    if (data.getLine(position).inInsideCondlist(position) && !data.isInsideConditionGroup(position) && !data.isInsideFunctionGroup(position)) {
        return await getSections(data, position);
    }
}

async function getSections(data: LtxDocument, position : Position) : Promise<CompletionItem[]> {
    var items = [];
    var currentSection = data.getSectionByPosition(position).name;
    for await (const section of Array.from(new Set(data.getSectionsName()))) {
        if (section !== currentSection) {
            items.push(new CompletionItem(section, CompletionItemKind.Class));
        }
    }
    return items;
}