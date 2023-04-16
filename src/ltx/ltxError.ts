import { DiagnosticSeverity, Range } from "vscode";

export class LtxError {
    data: string
    range: Range
    descr: string
    errorType: DiagnosticSeverity
    tag: string

    constructor(data: string, range: Range, descr: string, errorType = DiagnosticSeverity.Error, tag? : string) {
        this.data = data;
        this.range = range;
        this.descr = descr;
        this.errorType = errorType;
        this.tag = tag;
    }
}