import { TextDocument, Position, CancellationToken, Hover, ProviderResult, MarkdownString } from "vscode";
import { getLtxDocument } from "../extension";
import { LtxSemanticType } from "../ltx/ltxSemantic";
import { getFunctionsDocumentation } from "./logicActionsProvider";

export function provideHover(document: TextDocument, position: Position, token?: CancellationToken): ProviderResult<Hover> {
    const fileLtx = getLtxDocument(document);
    const semantic = fileLtx.getSemanticByPostition(position);
    
    if (semantic.type === LtxSemanticType.function) {
        var Mark = getFunctionsDocumentation(semantic.text.slice(1, semantic.text.length), true);
        Mark.supportHtml = true;
        return new Hover(Mark);
    }
}