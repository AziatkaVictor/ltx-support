import { WorkspaceEdit, CodeActionKind } from "vscode";
import { LtxCodeAction } from "../ltxCodeAction";
import { LtxError } from "../ltxError";

export class FixParameterCodeAction extends LtxCodeAction {
    kind?: CodeActionKind = CodeActionKind.QuickFix;

    constructor(error: LtxError, parapmName: string) {
        super(error);
        this.title = `Заменить на ${parapmName}`
        this.edit = new WorkspaceEdit();
        this.edit.replace(error.getOwner().uri, error.range, parapmName);
    }
}