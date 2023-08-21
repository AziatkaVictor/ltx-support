import { DiagnosticSeverity } from "vscode";
import { LtxError } from "../ltxError";
import { DeletionLineCodeAction } from "../CodeActions/DeletionLine";
import { LtxCodeAction } from "../ltxCodeAction";

export class InvalidLineError extends LtxError {
    text: string = "Некорректная запись.";
    type: DiagnosticSeverity = DiagnosticSeverity.Error;
    tag: string = "InvalidLine";

    getActions(): LtxCodeAction[] {
        return [new DeletionLineCodeAction(this)];
    }
}