import { CancellationToken, Event, FoldingContext, FoldingRange, FoldingRangeKind, FoldingRangeProvider, ProviderResult, TextDocument } from "vscode";
import { DocumentsManager, Section } from "../classes/ltx";

export class CustomFoldingRangeProvider implements FoldingRangeProvider {
    constructor(private documents: DocumentsManager) { }

    onDidChangeFoldingRanges?: Event<void>;
    provideFoldingRanges(document: TextDocument, context: FoldingContext, token: CancellationToken): ProviderResult<FoldingRange[]> {
        const data = this.documents.get(document);
        if (!data) return;

        return data.sections.map((value: Section, index: number, array: Section[]) => {
            return new FoldingRange(value.range.start.line, value.range.end.line, FoldingRangeKind.Region);
        });
    }
}