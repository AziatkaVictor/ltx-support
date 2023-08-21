import { DiagnosticSeverity } from "vscode";
import { LtxError } from "../ltxError";

export class SelfSectionLinkError extends LtxError {
    text: string = "Нельзя ссылаться на самого себя.";
    type: DiagnosticSeverity = DiagnosticSeverity.Error;
    tag: string = "SelfSectionLink";
}