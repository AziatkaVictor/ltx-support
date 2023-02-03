import { Position, Range } from "vscode";
import { sectionsArray } from "./ltxDocument";
import { LtxSectionLink } from "./ltxSectionLink";
import { addSemantic, LtxSemantic, LtxSemanticDescription, LtxSemanticModification, LtxSemanticType } from "./ltxSemantic";

export class LtxCondlist {
    readonly range: Range;
    readonly lineIndex: number;
    readonly condition?;
    readonly conditionRange?: Range | null;
    readonly function?;
    readonly functionRange?: Range | null;
    readonly sectionLink?: LtxSectionLink;
    
    isInside(position : Position) {
        return this.range.contains(position);
    }

    constructor(lineNumber: number, index: number, data: string) {
        let tempData = data;
        this.range = new Range(new Position(lineNumber, index), new Position(lineNumber, index + data.length))
        this.lineIndex = lineNumber;

        this.condition = /\{.*?\}/.exec(tempData);
        this.function = /\%.*?\%/.exec(tempData);

        if (this.condition) {
            this.conditionRange = new Range(new Position(lineNumber, index + this.condition.index), new Position(lineNumber, index + this.condition[0].length + this.condition.index - 1));
        }
        if (this.function) {
            this.functionRange = new Range(new Position(lineNumber, index + this.function.index), new Position(lineNumber, index + this.function[0].length + this.function.index - 1));
        }

        this.findElements(/(\+|\-)\w*\b(?<=\w)/g, tempData, index, LtxSemanticType.variable, LtxSemanticModification.declaration, LtxSemanticDescription.info);
        this.findElements(/(\=|\!)\w*\b(?<=\w)/g, tempData, index, LtxSemanticType.function, LtxSemanticModification.readonly, LtxSemanticDescription.signal);
        this.findElements(/\b(nil|true|false|complete|fail)\b/g, tempData, index, LtxSemanticType.keyword, LtxSemanticModification.readonly, LtxSemanticDescription.signal);
        this.findElements(/(?<!\w)\d+/g, tempData, index, LtxSemanticType.function, LtxSemanticModification.declaration, LtxSemanticDescription.signal);

        for (let count = 0; count < sectionsArray.length; count++) {
            this.findElements(new RegExp("(?<![\\w\\\\\"])" + sectionsArray[count] + "(?![\\w\\@]+)(?=\\b)", "g"), tempData, index, LtxSemanticType.class, LtxSemanticModification.definition, LtxSemanticDescription.sectionLink);
        }

        this.findElements(/[\w\*\.\@\$\\]+/g, tempData, index, LtxSemanticType.string, null, LtxSemanticDescription.signal);
    }

    private findElements(RegExp : RegExp, content : string, index : number, SemanticType : LtxSemanticType, SemanticModification, SemanticDescription) {
        var match;
        while ((match = RegExp.exec(content)) !== null) {
            let range = new Range(new Position(this.lineIndex, index + match.index), new Position(this.lineIndex, index + match.index + match[0].length))
            addSemantic(new LtxSemantic(SemanticType, SemanticModification, range, SemanticDescription, match[0]))
            content = this.replaceText(content, match[0]);
        }
    }

    private replaceText(data, text) {
        return data.replace(new RegExp("(?<=\\b)\\" + text + "(?=\\b)"), " ".repeat(text.length));
    }
}