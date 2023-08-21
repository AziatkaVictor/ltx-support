import { TextDocument, Range, CodeAction, CancellationToken, CodeActionContext, ProviderResult, Selection } from "vscode";
import { getLtxDocument } from "../extension";

export function provideCodeActions(document: TextDocument, range: Range | Selection, context: CodeActionContext, token: CancellationToken): ProviderResult<CodeAction[]> {
    const data = getLtxDocument(document);
    if (!data) {
        return;
    }
    var result = [];
    for (const error of data.getErrorsByPosition(range.start)) {
        result = result.concat(error.getActions());
    }
    return result;
}