import { CancellationToken, CompletionContext, SemanticTokens, SemanticTokensBuilder, SemanticTokensLegend, TextDocument } from "vscode";
import { getLtxDocument } from "../extension";

const tokenTypes = ['property', 'struct', 'class', 'number', 'keyword', 'function', 'variable', 'string', "constant"];
const tokenModifiers = ['declaration', 'definition', 'documentation', 'readonly'];
export const legend = new SemanticTokensLegend(tokenTypes, tokenModifiers);

export async function provideLogicSemantic(document: TextDocument, token?: CancellationToken, context?: CompletionContext): Promise<SemanticTokens> {
    const tokensBuilder = new SemanticTokensBuilder(legend);
    var data = getLtxDocument(document);

    for await (const semanticItem of data.getSemanticData()) {
        let modification = [];
        if (semanticItem.modification) {
            modification.push(semanticItem.modification);
        }
        tokensBuilder.push(semanticItem.range, semanticItem.type, modification);
    }
    return tokensBuilder.build();
}