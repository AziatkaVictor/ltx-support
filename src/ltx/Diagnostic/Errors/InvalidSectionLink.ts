import { DiagnosticSeverity } from "vscode";
import { LtxError } from "../ltxError";
import { LtxCodeAction } from "../ltxCodeAction";
import { FixSectionLinkCodeAction } from "../CodeActions/FixSectionLink";
import { DeletionSectionLinkCodeAction } from "../CodeActions/DeletionSectionLink";

export class InvalidSectionLinkError extends LtxError {
    text: string = "Ссылка на несуществующую секцию";
    type: DiagnosticSeverity = DiagnosticSeverity.Error;
    tag: string = "InvalidSectionLink";

    getActions(): LtxCodeAction[] {
        return [new FixSectionLinkCodeAction(this), new DeletionSectionLinkCodeAction(this)];
    }
}