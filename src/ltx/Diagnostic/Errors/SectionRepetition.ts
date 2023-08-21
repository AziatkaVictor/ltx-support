import { DiagnosticSeverity } from "vscode";
import { LtxError } from "../ltxError";

export class SectionRepetitionError extends LtxError {
    text: string = "Повторение имени секции.";
    type: DiagnosticSeverity = DiagnosticSeverity.Error;
    tag: string = "SectionRepetition";
}