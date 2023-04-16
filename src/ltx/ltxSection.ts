import { DiagnosticSeverity, Position, Range } from "vscode";
import { isDiagnosticEnabled } from "../settings";
import { getSectionData, getBasedConditions, getModules } from "../utils/modulesParser";
import { LtxDocumentType } from "./ltxDocument";
import { LtxLine } from "./ltxLine";
import { addSemantic, LtxSemantic, LtxSemanticDescription, LtxSemanticModification, LtxSemanticType } from "./ltxSemantic";

export class LtxSection {
    readonly name: string
    private type: string
    readonly startLine: number
    readonly linkRange?: Range
    endLine?: number

    lines: Map<number, LtxLine>
    private tempLines: Map<number, string> = new Map<number, string>()

    validate() {
        // if (this.tempLines.size === 0) {
        //     addError(this.linkRange, "Рекомендуется, если хотите закончить логику, использовать nil.", this.name, DiagnosticSeverity.Warning, "ReplaceToNil");
        // }
    }

    close(line? : number) {
        if (!line) {
            this.endLine = this.tempLines.size !== 0 ? Math.max(...Array.from(this.tempLines.keys())) : this.startLine;
        }
        else {
            this.endLine = line;
        }

        if (isDiagnosticEnabled()) {
            this.validate();
        }
    }

    addTempLine(index: number, line: string) {
        this.tempLines.set(index, line);
    }

    async parseLines() {
        if (this.tempLines.size === 0) {
            return;
        }
        let data = new Map<number, LtxLine>();
        for await (const [key, value] of this.tempLines) {
            data.set(key, new LtxLine(key, value, this));
        }
        this.lines = data;
    }

    getTypeName() {
        return this.type;
    }

    getParams() {
        return getSectionData().get(this.type).concat(getBasedConditions());
    }

    getModuleType() {
        for (const sectionModule of getModules()) {
            if (sectionModule.indexOf(this.type) !== -1) {
                return sectionModule.split(":")[2];
            }
        }
    }

    getText() {
        var data = "";
        for (const line of this.tempLines.values()) {
            data = data.concat(line + "\n");
        }
        return data;
    }

    constructor(name: string, startLine: number, startCharacter: number, filetype: LtxDocumentType) {
        this.name = name.slice(1, name.length - 1).trim();
        if (this.name !== "") {
            this.type = (/^\w*[^\@.*]/.exec(name.slice(1, name.length - 1)))[0];
        }

        this.linkRange = new Range(new Position(startLine, startCharacter + 1), new Position(startLine, startCharacter + name.length - 1));
        this.startLine = startLine;
        addSemantic(new LtxSemantic(LtxSemanticType.struct, LtxSemanticModification.declaration, this.linkRange, LtxSemanticDescription.signal, this.name))
    }
}
