import { DiagnosticSeverity } from "vscode";
import { LtxError } from "../ltxError";
import { LtxCodeAction } from "../ltxCodeAction";
import { DeletionSectionCodeAction } from "../CodeActions/DeletionSection";

export class UselessSectionError extends LtxError {
    text: string = "Данная секция не используется.";
    type: DiagnosticSeverity = DiagnosticSeverity.Information;
    tag: string = "UselessSection";

    getActions(): LtxCodeAction[] {
        return [new DeletionSectionCodeAction(this)];
    }
}