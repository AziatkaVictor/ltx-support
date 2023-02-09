import { CancellationToken, FoldingRange, FoldingRangeKind, Position, ProviderResult, TextDocument } from "vscode";
import { getLtxDocument } from "../extension";

export function provideFolding(document: TextDocument, position: Position, token?: CancellationToken): ProviderResult<FoldingRange[]> {
    var data = getLtxDocument(document);
    return data.getSections().map((section) => {
        return new FoldingRange(section.startLine, section.endLine, FoldingRangeKind.Region);
    });
}