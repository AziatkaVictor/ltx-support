import { DiagnosticSeverity } from "vscode";
import { LtxError } from "../ltxError";

export class InvalidDeclarationError extends LtxError {
    text: string = "Некорректное объявение";
    type: DiagnosticSeverity = DiagnosticSeverity.Error;
    tag: string = "InvalidDeclaration";
}