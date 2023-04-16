import { TextDocument, Position, CancellationToken, Hover, MarkdownString } from "vscode";
import { DocumentationKind, getDocumentation } from "../documentation";
import { getLtxDocument } from "../extension";
import { LtxSemanticType } from "../ltx/ltxSemantic";

export async function provideHover(document: TextDocument, position: Position, token?: CancellationToken) {
    const fileLtx = getLtxDocument(document);
    const semantic = fileLtx.getSemanticByPostition(position);

    var Mark = new MarkdownString();        
    Mark.supportHtml = true;
    if (!semantic) {
        Mark = await getDocumentation(document.getText(document.getWordRangeAtPosition(position)), DocumentationKind.Variable, true);
        return new Hover(Mark);
    }
    if (semantic.type === LtxSemanticType.function) {
        if (fileLtx.isInsideCondition(position)) {
            Mark = await getDocumentation(semantic.text.slice(1, semantic.text.length), DocumentationKind.Conditions, true);
        }
        else if (fileLtx.isInsideFunction(position)) {
            Mark = await getDocumentation(semantic.text.slice(1, semantic.text.length), DocumentationKind.Functions, true);
        }
    }
    else if (semantic.type === LtxSemanticType.property) {
        Mark = await getDocumentation(semantic.text.replace(/[0-9]/g, ''), DocumentationKind.Property, true);
    }  
    else if (semantic.type === LtxSemanticType.struct) {
        Mark = await getDocumentation(semantic.text.replace(/\@.+/g, ''), DocumentationKind.SectionsType, true) 
    }     
    return new Hover(Mark);
}