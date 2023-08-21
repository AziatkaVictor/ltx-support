import { DiagnosticSeverity } from "vscode";
import { LtxError } from "../ltxError";
import { LtxCodeAction } from "../ltxCodeAction";
import { getBasedConditions, getMostSimilar } from "../../../utils/modulesParser";
import { FixParameterCodeAction } from "../CodeActions/FixParameter";

export class InvalidParameterError extends LtxError {
    text: string = "Неизвестный параметр";
    type: DiagnosticSeverity = DiagnosticSeverity.Error;
    tag: string = "InvalidParameter";

    getActions(): LtxCodeAction[] {
        var result = [];
        const section = this.getOwner().getSection(this.range.start);
        for (const parapmName of getMostSimilar(this.data, 3, section ? section.getParams() : getBasedConditions())) {
            result.push(new FixParameterCodeAction(this, parapmName.name.split(":")[1]));
        }
        return result;
    }
}