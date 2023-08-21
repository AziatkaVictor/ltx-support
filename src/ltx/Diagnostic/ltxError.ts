import { DiagnosticSeverity, Range } from "vscode";
import { isHideInformation } from "../../settings";
import { LtxCodeAction } from "./ltxCodeAction";
import { LtxDocument } from "../ltxDocument";

export abstract class LtxError {
    readonly data: string
    readonly text: string
    readonly overrideText: string
    readonly range: Range
    readonly type: DiagnosticSeverity = DiagnosticSeverity.Error;
    readonly tag: string

    private owner: LtxDocument

    constructor(range: Range, overrideText?: string, data?: string, type?: DiagnosticSeverity) {
        this.range = range;
        this.data = data;
        this.overrideText = overrideText;
        if (type) {
            let check = isHideInformation() && type == DiagnosticSeverity.Information;
            this.type = check ? DiagnosticSeverity.Hint : type;
        }
    }

    getDescription() {
        let description = this.overrideText ? this.overrideText : this.text
        return this.data ? `${this.data}: ${description}` : description;
    }

    getActions(): LtxCodeAction[] {
        return [];
    }
    
    setOwner(owner: LtxDocument) {
        this.owner = owner;
    }

    getOwner(): LtxDocument {
        return this.owner;
    }
}