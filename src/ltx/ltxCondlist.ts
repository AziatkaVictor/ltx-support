import { Position, Range } from "vscode";
import { sectionsArray } from "./ltxDocument";
import { addSemantic, LtxSemantic, LtxSemanticDescription, LtxSemanticModification, LtxSemanticType } from "./ltxSemantic";
import { LtxLine } from "./ltxLine";

export class LtxCondlist {
    readonly range: Range;
    readonly lineIndex: number;
    readonly positionIndex: number;
    readonly condition?;
    readonly conditionRange?: Range;
    readonly function?;
    readonly functionRange?: Range;
    readonly sectionLink?;

    private tempData;
    owner: LtxLine;

    isInside(position: Position): boolean {
        return this.range.start.isBefore(position) && this.range.end.isAfterOrEqual(position);
    }

    isInsideCondition(position: Position): boolean {
        return this.conditionRange ? this.conditionRange.start.isBefore(position) && this.conditionRange.end.isAfterOrEqual(position) : false;
    }

    isInsideFunction(position: Position): boolean {
        return this.functionRange ? this.functionRange.start.isBefore(position) && this.functionRange.end.isAfterOrEqual(position) : false;
    }

    constructor(lineIndex: number, PosIndex: number, content: string, owner: LtxLine) {
        this.tempData = content;
        this.owner = owner;
        this.range = new Range(new Position(lineIndex, PosIndex), new Position(lineIndex, PosIndex + content.length))
        this.lineIndex = lineIndex;
        this.positionIndex = PosIndex;

        this.condition = /\{.*?\}/.exec(content);
        this.function = /\%.*?\%/.exec(content);

        if (this.condition) {
            this.conditionRange = new Range(new Position(lineIndex, PosIndex + this.condition.index), new Position(lineIndex, PosIndex + this.condition[0].length + this.condition.index - 1));
        }
        if (this.function) {
            this.functionRange = new Range(new Position(lineIndex, PosIndex + this.function.index), new Position(lineIndex, PosIndex + this.function[0].length + this.function.index - 1));
        }

        this.findElements(/(\-|\+)(?!\d)\w*\b(?<=\w)/g, LtxSemanticType.variable, LtxSemanticModification.declaration, LtxSemanticDescription.info);
        this.findElements(/(\=|\!)\w*\b(?<=\w)/g, LtxSemanticType.function, LtxSemanticModification.definition, null);

        if (this.owner.canHaveSectionLink()) {
            this.findElements(/(?<![\w\@])[\w\@]+?(?![\w\@])(?=\b)/g, LtxSemanticType.class, LtxSemanticModification.definition, null, isOutside);
        }
        this.tempData = content;
    }

    private findElements(RegExp: RegExp, SemanticType: LtxSemanticType, SemanticModification: LtxSemanticModification, SemanticDescription: LtxSemanticDescription, condition?: (match: RegExpExecArray, condlist: LtxCondlist) => boolean) {
        var match;
        var data = [];
        while ((match = RegExp.exec(this.tempData)) !== null) {
            if (!(condition ? condition(match, this) : true)) {
                continue;
            }

            var start = this.positionIndex + match.index;
            var end = this.positionIndex + match.index + match[0].length;
            var range = new Range(new Position(this.lineIndex, start), new Position(this.lineIndex, end));
            var token = new LtxSemantic(SemanticType, SemanticModification, range, SemanticDescription, match[0]);
            addSemantic(token);
            data.push(token);
            this.tempData = this.replaceText(this.tempData, match.index, match.index + match[0].length);
        }
        return data;
    }

    private replaceText(data: string, start: number, end: number) {
        return data.substring(0, start) + " ".repeat(end - start) + data.substring(end);
    }
}

function isOutside(match: RegExpExecArray, condlist: LtxCondlist): boolean {
    if (!match || match[0] === "nil") {
        return false;
    }
    var pos = new Position(condlist.lineIndex, condlist.positionIndex + match.index);
    return !condlist.isInsideCondition(pos) && !condlist.isInsideFunction(pos);
}