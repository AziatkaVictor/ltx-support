import { Position, Range } from "vscode";
import { isDiagnosticEnabled } from "../settings";
import { getSectionData, getBasedConditions, getModules, getParamsByFile } from "../utils/modulesParser";
import { LtxDocument } from "./ltxDocument";
import { LtxLine } from "./ltxLine";
import { addSemantic, LtxSemantic, LtxSemanticDescription, LtxSemanticModification, LtxSemanticType } from "./ltxSemantic";
import { LtxSectionLink } from "./ltxSectionLink";
import { LtxDocumentType } from "./LtxDocumentType";
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

    lines: Map<number, LtxLine> = new Map<number, LtxLine>()
    private tempLines: Map<number, string> = new Map<number, string>()

    /**
     * Validate section, needed for Diagnostic
     */
    validate() {
        if (!this.isTypeValid()) {
            let error = new InvalidSectionTypeError(this.getTypeRange(), null, this.name);
            this.owner.addError(error);
            return; 
        }

        if (this.tempLines.size === 0) {
            let error = new EmptySectionError(this.getRange(), null, this.name);
            this.owner.addError(error);
        }
        if (this.owner.getType() === LtxDocumentType.Logic && !this.isHaveLinks() && !startSection.includes(this.getTypeName())) {
            let error = new UselessSectionError(this.getRange(), null, this.name);
            this.owner.addError(error);
        }
    }

    /**
     * Close section, which mean end of section. If line is empty, it calculate end by it self
     * @param line Index of sections end
     */
    close(line?: number) {
        this.endLine = this.tempLines.size !== 0 ? Math.max(...Array.from(this.tempLines.keys())) : this.startLine;
        if (line) {
            this.endLine = line;
        }

        if (isDiagnosticEnabled()) {
            this.validate();
        }
    }

    /**
     * Add line in stack, which will be analyzed later
     * @param index index of line in document
     * @param text content of line
    */
    addTempLine(index: number, text: string) {
        this.tempLines.set(index, text);
    }

    /**
     * Get sections range, needed for conditions and FoldingRange provider
     * @returns Range of section
     */
    getRange(): Range {
        const end = this.getLastLineIndex();
        return new Range(new Position(this.startLine, 0), new Position(end, this.tempLines.get(end) ? this.tempLines.get(end).length : this.name.length + 2));
    }

    /**
     * Get nuber of lines or parameters inside section, including whitespaces 
     * @returns Number of lines, including empty lines.
     */
    getLinesLenghtWithSpaces(): number {
        return this.startLine - this.getLastLineIndex() + 1;
    }
    
    /**
     * Get index of last line, ignoring whitespaces after it
     * @returns Index of last line
     */
    getLastLineIndex(): number {
        if (this.lines.size === 0) {
            console.debug("Can't find lines for [" + this.name + "] inside '" + this.getOwnedDocument().uri + "', line " + (this.startLine + 1));
            return this.startLine + 1;
        }
        return Array.from(this.lines.keys()).pop()
    }

    /**
     * Asynchrone analyse of lines in stack, which will be stored in `lines`
     */
    async parseLines() {
        if (this.tempLines.size === 0) return;

        let data = new Map<number, LtxLine>();
        for await (const [key, value] of this.tempLines) {
            data.set(key, new LtxLine(key, value, this));
        }
        this.lines = data;
    }

    /**
     * Check did it valide section type. It takes information from scripts.
     * @returns True if section type is valid, ignore validation when it is not a logic file
     */
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

    /**
     * Get a range of type, if type is not valid, it returns range of sections name it self
     * @returns Range of text in document
     */
    getTypeRange() {
        let start = new Position(this.startLine, this.linkRange.start.character);
        let end = new Position(this.startLine, this.linkRange.start.character + this.getTypeName() ? this.getTypeName().length + 1: this.name.length)
        return new Range(start, end);
    }

    /**
     * Get array of parameters, based on section and document type
     * @returns array of params
     */
    getParams(): string[] {
        let owner = this.getOwnedDocument();
        if (owner.getType() !== LtxDocumentType.Logic) {
            return owner.getTypeParams();
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
            console.debug("Can`t find section params for " + this.getTypeName());
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

    isEmpty(temp = false): boolean {
        return this.lines.size === 0;
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