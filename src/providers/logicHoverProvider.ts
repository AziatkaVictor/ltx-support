import { TextDocument, Position, CancellationToken, Hover, ProviderResult, MarkdownString } from "vscode";
import { DocumentationKind, getDocumentation } from "../documentation";
import { getLtxDocument } from "../extension";
import { LtxSemanticType } from "../ltx/ltxSemantic";
import { getParameterType } from "../lua/modulesParser";

export function provideHover(document: TextDocument, position: Position, token?: CancellationToken): ProviderResult<Hover> {
    const fileLtx = getLtxDocument(document);
    const semantic = fileLtx.getSemanticByPostition(position);
    var Mark : MarkdownString = new MarkdownString();

    if (semantic.type === LtxSemanticType.function) {
        Mark = getDocumentation(semantic.text.slice(1, semantic.text.length), DocumentationKind.Functions, true);
        Mark.supportHtml = true;
        return new Hover(Mark);
    }
    else if (semantic.type === LtxSemanticType.property) {
        var sectionName = fileLtx.getSectionByPosition(position).type.name;
        Mark = new MarkdownString(getParameterType(semantic.text, sectionName));
        Mark.supportHtml = true;
        return new Hover(Mark);
    }
}