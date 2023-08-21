import { Position, Range } from "vscode";
import { isDiagnosticEnabled } from "../settings";
import { getSectionData, getBasedConditions, getModules, getParamsByFile } from "../utils/modulesParser";
import { LtxDocument } from "./ltxDocument";
import { LtxLine } from "./ltxLine";
import { addSemantic, LtxSemantic, LtxSemanticDescription, LtxSemanticModification, LtxSemanticType } from "./ltxSemantic";
import { LtxSectionLink } from "./ltxSectionLink";
import { LtxDocumentType } from "./ltxDocumentType";
import { InvalidSectionTypeError } from "./Diagnostic/Errors/InvalidSectionType";
import { EmptySectionError } from "./Diagnostic/Errors/EmptySection";
import { UselessSectionError } from "./Diagnostic/Errors/UselessSection";

const ignoreSections = ["hit", "death", "meet", "gather_items"];
const startSection = ['anomal_zone', 'logic', 'smart_terrain', 'exclusive']
const ignoreParamValidation = ['exclusive'];
// TODO: Заменить на дополение параметров, а не игнор лист
const ignoreParamValidationByFiletype: { [key in LtxDocumentType]? : string[] } = {
    [LtxDocumentType.Squad]: ["story_id", "npc_in_squad", "auto_id", "arrive_dist"],
    [LtxDocumentType.Tasks]: ["condlist_"],
}

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
            let error = new InvalidSectionTypeError(this.getTypeRange(), null, this.name);
            this.owner.addError(error);
        }
        else {
            if (this.tempLines.size === 0) {
                let error = new EmptySectionError(this.getRange(), null, this.name);
                this.owner.addError(error);
            }
            if (this.owner.getType() === LtxDocumentType.Logic && !this.isHaveLinks() && !startSection.includes(this.getTypeName())) {
                let error = new UselessSectionError(this.getRange(), null, this.name);
                this.owner.addError(error);
            }
        }
    }

    close(line?: number) {
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

    getRange(): Range {
        const end = this.endLine ? this.endLine : this.startLine;
        return new Range(new Position(this.startLine, 0), new Position(end, this.tempLines.get(end) ? this.tempLines.get(end).length : this.name.length + 2));
    }

    getFoldingRange(): Range {
        const end = this.getLastLineIndex();
        return new Range(new Position(this.startLine, 0), new Position(end, this.tempLines.get(end) ? this.tempLines.get(end).length : this.name.length + 2));
    }

    getLinesLenghtWithSpaces(): number {
        return this.startLine - this.getLastLineIndex() + 1;
    }
    
    getLastLineIndex(): number {
        return Array.from(this.lines.keys()).pop()
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
        if (this.getOwnedDocument().getType() !== LtxDocumentType.Logic || startSection.includes(this.getTypeName())) {
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
        return new Range(new Position(this.startLine, this.linkRange.start.character), new Position(this.startLine, this.linkRange.start.character + this.getTypeName() ? this.getTypeName().length + 1: this.name.length));
    }

    getParams(): string[] {
        if (this.getOwnedDocument().getType() !== LtxDocumentType.Logic) {
            return this.getOwnedDocument().getTypeParams();
        }   
        var data = getSectionData().get(this.getTypeName()) || [];
        data = data.concat(getBasedConditions());
        var items = [];
        if (this.getModuleType() === "stype_stalker" && !ignoreSections.includes(this.getTypeName())) {
            items = items.concat(getParamsByFile("stalker_generic.script"));
            items = items.concat(getParamsByFile("xr_logic.script"));
            items = items.concat(getParamsByFile("xr_gather_items.script"));
            items = items.concat(getParamsByFile("xr_corpse_detection.script"));
        }
        if (this.getTypeName() === "logic") {
            items = items.concat(getParamsByFile("stalker_generic.script"));
            items = items.concat(getParamsByFile("gulag_general.script"));
        }
        if (data.concat(items).length === 0) {
            console.log("Can`t find section params for " + this.getTypeName());
        }
        return data.concat(items);
    }

    getModuleType() {   
        for (const sectionModule of getModules()) {
            if (sectionModule.indexOf(this.getTypeName()) !== -1) {
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

    getOwnedDocument(): LtxDocument {
        return this.owner;
    }

    getLinks(): LtxSectionLink[] | null {
        if (!this.name) {
            return;
        }
        var re = new RegExp(`(?<!(\\[|[\\w@]))${this.name}(?!(\\[|[\\w@]))`, "g");
        var match;
        var data = [];
        while ((match = re.exec(this.getOwnedDocument().text)) !== null) {
            let substr = this.getOwnedDocument().text.substring(0, match.index);
            let lineIndex = (substr.match(/\n/g) || []).length || 0;
            let offset = substr.lastIndexOf("\n") !== -1 ? substr.lastIndexOf("\n") : 0;
            data.push(new LtxSectionLink(match[0], new Position(lineIndex, match.index - offset - 1), new Position(lineIndex, match.index + match[0].length - offset - 1)));
        }
        return data;
    }

    isHaveLinks(): boolean {
        return this.getLinks() ? this.getLinks().length !== 0 : false;
    }

    isIgnoreParamValidation(paramName: string) {        
        return ignoreParamValidation.includes(this.getTypeName()) || ignoreParamValidationByFiletype[this.owner.getType()] ? ignoreParamValidationByFiletype[this.owner.getType()].includes(paramName) : false;
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