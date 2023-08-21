import { DiagnosticSeverity } from "vscode";
import { LtxError } from "../ltxError";
import { getConditions, getFunctions } from "../../../utils/actionsParser";
import { getMostSimilar } from "../../../utils/modulesParser";
import { LtxCodeAction } from "../ltxCodeAction";
import { FixFunctionCodeAction } from "../CodeActions/FixFunctions";

export class InvalidFunctionError extends LtxError {
    text: string = "Неизвестная функция";
    type: DiagnosticSeverity = DiagnosticSeverity.Error;
    tag: string = "InvalidFunction";

    getActions(): LtxCodeAction[] {
        var result = [];
        const type = this.getOwner().isInsideCondition(this.range.start);
        for (const functionName of getMostSimilar(this.data, 3, type ? getConditions() : getFunctions())) {
            result.push(new FixFunctionCodeAction(this, functionName.name));
        }
        return result;
    }
}