import { WorkspaceEdit, Range, Position, CodeActionKind } from "vscode";
import { LtxCodeAction } from "../ltxCodeAction";
import { LtxError } from "../ltxError";

export class DeletionLineCodeAction extends LtxCodeAction {
    kind?: CodeActionKind = CodeActionKind.QuickFix;
    title: string = "Удалить строку";
    
    constructor(error: LtxError) {
        super(error);
        this.edit = new WorkspaceEdit();
        let range = new Range(error.range.start, new Position(error.range.end.line + 1, 0));
        this.edit.delete(error.getOwner().uri, range);
    }
}