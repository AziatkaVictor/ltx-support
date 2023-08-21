import { DiagnosticSeverity } from "vscode";
import { LtxError } from "../ltxError";
import { DeletionSectionCodeAction } from "../CodeActions/DeletionSection";
import { LtxCodeAction } from "../ltxCodeAction";

export class EmptySectionError extends LtxError {
    text: string = "Пустая секция";
    type: DiagnosticSeverity = DiagnosticSeverity.Information;
    tag: string = "EmptySection";

    getActions(): LtxCodeAction[] {
        return [new DeletionSectionCodeAction(this)];
    }
}