import { DiagnosticSeverity } from "vscode";
import { LtxError } from "../ltxError";

export class InvalidConditionError extends LtxError {
    text: string = "Неверное условие, оно всегда будет ложным. Скорее всего, в условии есть два одинаковых инфо или функции с разными знаками.";
    type: DiagnosticSeverity = DiagnosticSeverity.Warning;
    tag: string = "InvalidCondition";
}