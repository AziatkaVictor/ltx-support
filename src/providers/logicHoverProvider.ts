import { TextDocument, Position, CancellationToken, Hover, ProviderResult, MarkdownString } from "vscode";
import { DocumentationKind, getDocumentation } from "../documentation";
import { getLtxDocument } from "../extension";
import { LtxSemanticType } from "../ltx/ltxSemantic";

export function provideHover(document: TextDocument, position: Position, token?: CancellationToken): ProviderResult<Hover> {
    const fileLtx = getLtxDocument(document);
    const semantic = fileLtx.getSemanticByPostition(position);

    if (!semantic) {
        return;
    }

    var Mark = new MarkdownString();        
    Mark.supportHtml = true;
    if (semantic.type === LtxSemanticType.function) {
        Mark = getDocumentation(semantic.text.slice(1, semantic.text.length), DocumentationKind.Functions, true);
    }
    else if (semantic.type === LtxSemanticType.property) {
        Mark = getDocumentation(semantic.text.replace(/[0-9]/g, ''), DocumentationKind.Property, true);
    }        
    return new Hover(Mark);
}