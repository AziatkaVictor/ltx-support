import { CancellationToken, FoldingRange, FoldingRangeKind, Position, ProviderResult, TextDocument } from "vscode";
import { getLtxDocument } from "../extension";

export function provideFolding(document: TextDocument, position: Position, token?: CancellationToken): ProviderResult<FoldingRange[]> {
    var data = getLtxDocument(document);
    var result = [];
    for (const section of data.getSections()) {
        if (section.isEmpty()) {
            continue;
        }
        const range = section.getRange();
        result.push(new FoldingRange(range.start.line, range.end.line, FoldingRangeKind.Region));
    }        
    return result;
}