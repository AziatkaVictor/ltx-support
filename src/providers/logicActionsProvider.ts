import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, MarkdownString, Position, TextDocument } from "vscode";
import { getLtxDocument } from "../extension";
import { getConditions, getFunctions } from "../lua/actionsParser";

const docs = require("../../data/logic_documentation.json");

export async function provideLogicActions(document: TextDocument, position: Position, token?: CancellationToken, context?: CompletionContext): Promise<CompletionItem[] | undefined> {
    var data = getLtxDocument(document);
    
    if (data.isInsideFunctionGroup(position) && context.triggerCharacter !== "!") {
        return getLogicCompletionItems(getFunctions(), "xr_effects.");
    }
    else if (data.isInsideConditionGroup(position)) {
        return getLogicCompletionItems(getConditions(), "xr_conditions.");
    }
}

function getLogicCompletionItems(items : string[], filename : string) : CompletionItem[] {
    return items.map((element : string) => {
        let item = new CompletionItem(element, CompletionItemKind.Function)
        item.detail = filename + element;
        if (docs[element]) {
            let Mark = new MarkdownString(docs[element]['documentation']);
            Mark.isTrusted = true;
            Mark.supportHtml = true;
            item.documentation = Mark;
        }
        return item;
    });
}