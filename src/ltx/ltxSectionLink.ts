import { Position } from "vscode";
import { LtxSection } from "./ltxSection";

export class LtxSectionLink {
    name: string
    section: LtxSection
    start: Position
    end: Position

    setLink(section: LtxSection) {
        this.section = section;
    }

    constructor(name: string, start: Position, end: Position) {
        this.name = name;
        this.start = start;
        this.end = end;
    }
}
