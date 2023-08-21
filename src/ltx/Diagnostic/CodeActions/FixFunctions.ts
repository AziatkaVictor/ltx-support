import { WorkspaceEdit, CodeActionKind } from "vscode";
import { LtxCodeAction } from "../ltxCodeAction";
import { LtxError } from "../ltxError";

export class FixFunctionCodeAction extends LtxCodeAction {
    kind?: CodeActionKind = CodeActionKind.QuickFix;

    constructor(error: LtxError, functionName: string) {
        super(error);
        this.title = `Заменить на ${functionName}`
        this.edit = new WorkspaceEdit();
        this.edit.replace(error.getOwner().uri, error.range, functionName);
    }
}