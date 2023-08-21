import { DiagnosticSeverity } from "vscode";
import { LtxError } from "../ltxError";

export class MultipleSectionLinkError extends LtxError {
    text: string = "В одном Condlist-е не можеть быть несколько ссылок на секции.";
    type: DiagnosticSeverity = DiagnosticSeverity.Error;
    tag: string = "MultipleSectionLink";
}