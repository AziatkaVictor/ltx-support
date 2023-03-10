import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, MarkdownString, Position, TextDocument, window, QuickPickItem } from "vscode";
import { DocumentationKind, getDocumentation } from "../documentation";
import { getLtxDocument } from "../extension";
import { getConditions, getFunctions } from "../lua/actionsParser";

export async function provideLogicActions(document: TextDocument, position: Position, token?: CancellationToken, context?: CompletionContext): Promise<CompletionItem[] | undefined> {
    var data = getLtxDocument(document);
    if (data.isInsideArgumentsGroup(position)) {
        return;
    }

    if (data.isInsideFunction(position) && context.triggerCharacter !== "!") {
        return getLogicCompletionItems(getFunctions(), "xr_effects");
    }
    else if (data.isInsideCondition(position)) {
        return getLogicCompletionItems(getConditions(), "xr_conditions");
    }
}

function getLogicCompletionItems(items : string[], filename : string) : CompletionItem[] {
    return items.map((element : string) => {
        var item = new CompletionItem(element, CompletionItemKind.Function)
        item.detail = filename + "." + element;   
        var Mark = getDocumentation(element, filename as DocumentationKind);
        item.documentation = Mark;
        return item;
    });
}