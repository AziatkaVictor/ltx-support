import { Position, Range } from "vscode";
import { sectionsArray } from "./ltxDocument";
import { addSemantic, LtxSemantic, LtxSemanticDescription, LtxSemanticModification, LtxSemanticType } from "./ltxSemantic";

export class LtxCondlist {
    readonly range: Range;
    readonly lineIndex: number;
    readonly positionIndex: number;
    readonly condition?;
    readonly conditionRange?: Range;
    readonly function?;
    readonly functionRange?: Range;

    private tempData;
    
    isInside(position : Position) {
        return this.range.contains(position);
    }

    constructor(lineNumber: number, index: number, data: string) {
        this.tempData = data;
        this.range = new Range(new Position(lineNumber, index), new Position(lineNumber, index + data.length))
        this.lineIndex = lineNumber;
        this.positionIndex = index;

        this.condition = /\{.*?\}/.exec(this.tempData);
        this.function = /\%.*?\%/.exec(this.tempData);

        if (this.condition) {
            this.conditionRange = new Range(new Position(lineNumber, index + this.condition.index), new Position(lineNumber, index + this.condition[0].length + this.condition.index - 1));
        }
        if (this.function) {
            this.functionRange = new Range(new Position(lineNumber, index + this.function.index), new Position(lineNumber, index + this.function[0].length + this.function.index - 1));
        }

        this.findElements(/(\+|\-)\w*\b(?<=\w)/g, LtxSemanticType.variable, LtxSemanticModification.declaration, LtxSemanticDescription.info);
        this.findElements(/(\=|\!)\w*\b(?<=\w)/g, LtxSemanticType.function, LtxSemanticModification.readonly, null);

        for (let count = 0; count < sectionsArray.length; count++) {
            this.findElements(new RegExp("(?<![\\w\\\\\"])" + sectionsArray[count] + "(?![\\w\\@]+)(?=\\b)", "g"), LtxSemanticType.class, LtxSemanticModification.definition, null);
        }
    }

    private findElements(RegExp : RegExp, SemanticType : LtxSemanticType, SemanticModification, SemanticDescription) {
        var match;
        while ((match = RegExp.exec(this.tempData)) !== null) {
            let range = new Range(new Position(this.lineIndex, this.positionIndex + match.index), new Position(this.lineIndex, this.positionIndex + match.index + match[0].length))
            addSemantic(new LtxSemantic(SemanticType, SemanticModification, range, SemanticDescription, match[0]))
            this.tempData = this.replaceText(this.tempData, match[0]);
        }
    }

    private replaceText(data, text) {
        return data.replace(new RegExp("(?<=\\b)\\" + text + "(?=\\b)"), " ".repeat(text.length));
    }
}