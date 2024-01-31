import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionItemProvider, CompletionList, Position, ProviderResult, TextDocument } from "vscode";
import { DocumentsManager, Section } from "../classes/ltx";

export class CustomCompletionProvider implements CompletionItemProvider {
    constructor(private data: DocumentsManager) {}

    provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionItem[] | CompletionList<CompletionItem>> {
        const documentData = this.data.get(document);      
        
        if (context?.triggerCharacter == "[" || documentData.isSectionDeclaration(position)) {
            return [
                new CompletionItem("sr_idle", CompletionItemKind.Class)
            ];
        }

        return documentData.sections.map((value: Section, index: number, array: Section[]) => {
            return new CompletionItem(value.name, CompletionItemKind.Reference);
        });
    }

    resolveCompletionItem?(item: CompletionItem, token: CancellationToken): ProviderResult<CompletionItem> {
        return item;
    }
}
