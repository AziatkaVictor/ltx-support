import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionItemProvider, CompletionList, Position, ProviderResult, TextDocument } from "vscode";
import { DocumentsManager, Section } from "../classes/ltx";

export class CustomCompletionProvider implements CompletionItemProvider {
    constructor(private data: DocumentsManager) {}

    provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionItem[] | CompletionList<CompletionItem>> {
        const documentData = this.data.get(document);

        return documentData.sections.map((value: Section, index: number, array: Section[]) => {
            return new CompletionItem("Section " + index, CompletionItemKind.Class);
        });
    }

    resolveCompletionItem?(item: CompletionItem, token: CancellationToken): ProviderResult<CompletionItem> {
        return item;
    }
}
