import { WorkspaceEdit, TextEdit, Range, Position, CodeActionKind, CodeAction } from "vscode";
import { LtxCodeAction } from "../ltxCodeAction";
import { LtxError } from "../ltxError";

export class DeletionSectionCodeAction extends LtxCodeAction {
    kind?: CodeActionKind = CodeActionKind.QuickFix;
    
    constructor(error: LtxError) {
        super(error);
        this.edit = new WorkspaceEdit();
        const section = error.getOwner().getSection(error.range.start);
        this.title = `Удалить секцию ${section.name}`;
        var edits = [];
        for (const link of section.getLinks()) {
            edits.push(new TextEdit(new Range(link.start, link.end), "nil"));
        }
        let range = new Range(error.range.start, new Position(error.range.end.line + 1, 0));
        this.edit.delete(error.getOwner().uri, range);
        this.edit.set(error.getOwner().uri, edits);
    }
}