import { CodeActionKind, WorkspaceEdit, Position } from "vscode";
import { LtxCodeAction } from "../ltxCodeAction";
import { LtxError } from "../ltxError";

export class DeletionSectionLinkCodeAction extends LtxCodeAction {
    kind?: CodeActionKind = CodeActionKind.QuickFix;
    title: string = "Заменить на nil";

    constructor(error: LtxError) {
        super(error);
        this.edit = new WorkspaceEdit();
        this.edit.replace(error.getOwner().uri, error.range, "nil");
    }
}