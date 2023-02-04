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

function getDocumentationFile(name : string) {
    try {
        return require(docsPath + name + "_docs.json");
    } catch (error) {   
        console.log(error);
        return;
    }
}

function getLogicCompletionItems(items : string[], filename : string) : CompletionItem[] {
    return items.map((element : string) => {
        var item = new CompletionItem(element, CompletionItemKind.Function)
        item.detail = filename + "." + element;

        const docs = getDocumentationFile(filename);
        if (!docs) {
            return item;
        }
        if (!docs[element]) {
            return item;
        }
        
        let Mark = new MarkdownString(docs[element]['documentation']);
        Mark.isTrusted = true;
        Mark.supportHtml = true;
        item.documentation = Mark;
        return item;
    });
}