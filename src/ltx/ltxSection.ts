import { DiagnosticSeverity, Position, Range } from "vscode";
import { isDiagnosticEnabled } from "../settings";
import { getSectionData, getBasedConditions, getModules } from "../utils/modulesParser";
import { LtxDocument, LtxDocumentType } from "./ltxDocument";
import { LtxLine } from "./ltxLine";
import { addSemantic, LtxSemantic, LtxSemanticDescription, LtxSemanticModification, LtxSemanticType } from "./ltxSemantic";
import { LtxSectionLink } from "./ltxSectionLink";

export class LtxSection {
    private owner: LtxDocument;
    readonly name: string
    private type: string
    readonly startLine: number
    readonly linkRange?: Range
    endLine?: number

    lines: Map<number, LtxLine>
    private tempLines: Map<number, string> = new Map<number, string>()

    validate() {
        if (!this.isTypeValid()) {
            this.owner.addError(this.getTypeRange(), "Неизвестный тип секции.", this.name, DiagnosticSeverity.Error, "InvalidSectionType");
        }
        else {
            if (this.tempLines.size === 0) {
                this.owner.addError(this.getRange(), "Пустая секция", this.name, DiagnosticSeverity.Information, this.isHaveLinks() ? "ReplaceSectionToNil" : "Remove");
            }
            if (this.owner.getType() === LtxDocumentType.Logic && !this.isHaveLinks() && this.getTypeName() !== "logic") {
                this.owner.addError(this.getRange(), "Данная секция не используется.", this.name, DiagnosticSeverity.Information, "Remove");
            }
        }
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

    getRange() {
        const end = this.endLine ? this.endLine : this.startLine;
        return new Range(new Position(this.startLine, 0), new Position(end, this.tempLines.get(end) ? this.tempLines.get(end).length : this.name.length + 2));
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

    isTypeValid() {
        if (this.owner.getType() !== LtxDocumentType.Logic) {
            return true;
        }
        if (getSectionData().get(this.getTypeName())) {
            return true;
        }
        return false;
    }

    getTypeName() {
        return this.type;
    }

    getTypeRange() {
        return new Range(new Position(this.startLine, this.linkRange.start.character), new Position(this.startLine, this.linkRange.start.character + this.getTypeName().length));
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

    getOwner() {
        return this.owner;
    }
    
    getLinks(): LtxSectionLink[]|null {
        if (!this.name) {
            return;
        }
        var re = new RegExp(`(?<!(\\[|[\\w@]))${this.name}(?!(\\[|[\\w@]))`, "g");
        var match;
        var data = [];
        while ((match = re.exec(this.getOwner().text)) !== null) {
            let substr = this.getOwner().text.substring(0, match.index);
            let lineIndex = (substr.match(/\n/g) || []).length || 0;
            let offset = substr.lastIndexOf("\n") !== -1 ? substr.lastIndexOf("\n") : 0;
            data.push(new LtxSectionLink(match[0], new Position(lineIndex, match.index - offset - 1), new Position(lineIndex, match.index + match[0].length - offset - 1)));
        }
        return data;
    }

    isHaveLinks(): boolean {
        return this.getLinks() ? this.getLinks().length !== 0 : false;
    }

    constructor(name: string, startLine: number, startCharacter: number, filetype: LtxDocumentType, owner: LtxDocument) {
        this.owner = owner;
        this.name = name.slice(1, name.length - 1).trim();
        if (this.name !== "") {
            this.type = (/^\w*[^\@.*]/.exec(name.slice(1, name.length - 1)))[0];
        }

        this.linkRange = new Range(new Position(startLine, startCharacter + 1), new Position(startLine, startCharacter + name.length - 1));
        this.startLine = startLine;  
        addSemantic(new LtxSemantic(LtxSemanticType.struct, LtxSemanticModification.declaration, this.linkRange, LtxSemanticDescription.signal, this.name));
    }
}
