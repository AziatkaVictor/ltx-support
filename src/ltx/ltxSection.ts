import { Position, Range } from "vscode";
import { addError } from "./ltxError";
import { LtxLine } from "./ltxLine";
import { LtxSectionType } from "./ltxSectionType";
import { addSemantic, LtxSemantic, LtxSemanticDescription, LtxSemanticModification, LtxSemanticType } from "./ltxSemantic";

export class LtxSection {
    readonly name: string
    readonly type: LtxSectionType
    readonly startLine: number
    readonly linkRange?: Range
    endLine?: number
    lines: Map<number, LtxLine> = new Map<number, LtxLine>()

    checkExceptedParams() {
        let data = [];
        this.lines.forEach(line => {
            data.push(line.propertyName);
        });

        this.type.params.forEach(element => {
            if (element.isOptional === false) {
                if (data.indexOf(element.name) === -1) {
                    addError(this.linkRange, "Отсутствует необходимый параметр.", element.name)
                }
            }
        });
    }

    setEndLine(line: number) {
        this.endLine = line;
        if (this.lines.size === 0) {
            addError(this.linkRange, "Секция должна содержать параметры. Если хотите закончить логику, то лучше использовать nil.", this.name);
        }
    }

    constructor(name: string, startLine: number, startCharacter: number) {
        this.name = name;
        this.type = new LtxSectionType((/^\w*[^\@.*]/.exec(name.slice(1, name.length - 1)))[0]);
        this.linkRange = new Range(new Position(startLine, startCharacter + 1), new Position(startLine, startCharacter + name.length - 1))
        addSemantic(new LtxSemantic(LtxSemanticType.struct, LtxSemanticModification.declaration, this.linkRange, LtxSemanticDescription.signal, this.name))
        this.startLine = startLine;

        if (this.type.isValid === false) {
            addError(this.linkRange, "Неизвестный тип секции.", this.name);
        }
    }
}
