import { CancellationToken, FoldingRange, FoldingRangeKind, Position, ProviderResult, TextDocument } from "vscode";
import { getLtxDocument } from "../extension";

export function provideFolding(document: TextDocument, position: Position, token?: CancellationToken): ProviderResult<FoldingRange[]> {
    var data = getLtxDocument(document);
    return data.getSections().map((section) => {
        const range = section.getFoldingRange();
        return new FoldingRange(range.start.line, range.end.line, FoldingRangeKind.Region);
    });
}