import { WorkspaceEdit, CodeActionKind } from "vscode";
import { LtxCodeAction } from "../ltxCodeAction";
import { LtxError } from "../ltxError";

export class FixSectionTypeCodeAction extends LtxCodeAction {
    kind?: CodeActionKind = CodeActionKind.QuickFix;

    constructor(error: LtxError, sectionName: string) {
        super(error);
        this.title = `Заменить на ${sectionName}`
        this.edit = new WorkspaceEdit();
        this.edit.replace(error.getOwner().uri, error.range, sectionName);
    }
}