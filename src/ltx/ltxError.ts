import { DiagnosticSeverity, Range } from "vscode";
import { isHideInformation } from "../settings";

export class LtxError {
    data: string
    range: Range
    descr: string
    errorType: DiagnosticSeverity
    tag: string

    constructor(range: Range, descr: string, data?: string, errorType = DiagnosticSeverity.Error, tag? : string) {
        this.data = data;
        this.range = range;
        this.descr = data ? `\`${data}\`: ${descr}` : descr;
        this.errorType = isHideInformation() && errorType == DiagnosticSeverity.Information ? DiagnosticSeverity.Hint : errorType;
        this.tag = tag;
    }
}