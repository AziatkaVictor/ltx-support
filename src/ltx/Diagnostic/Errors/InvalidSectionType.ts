import { DiagnosticSeverity } from "vscode";
import { LtxError } from "../ltxError";
import { LtxCodeAction } from "../ltxCodeAction";
import { FixSectionTypeCodeAction } from "../CodeActions/FixSectionType";
import { getMostSimilar, getSectionData } from "../../../utils/modulesParser";

export class InvalidSectionTypeError extends LtxError {
    text: string = "Неизвестный тип секции";
    type: DiagnosticSeverity = DiagnosticSeverity.Error;
    tag: string = "InvalidSectionType";

    getActions(): LtxCodeAction[] {
        var result = [];
        const section = this.getOwner().getSection(this.range.start);
        for (const sectionType of getMostSimilar(section.name, 3, Array.from(getSectionData().keys()))) {
            result.push(new FixSectionTypeCodeAction(this, sectionType.name));
        }
        return result;
    }
}