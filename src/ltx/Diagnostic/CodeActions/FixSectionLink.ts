import { WorkspaceEdit, Position, CodeActionKind } from "vscode";
import { LtxCodeAction } from "../ltxCodeAction";
import { LtxError } from "../ltxError";

export class FixSectionLinkCodeAction extends LtxCodeAction {
    kind?: CodeActionKind = CodeActionKind.QuickFix;

    constructor(error: LtxError) {
        super(error);
        const section = error.getOwner().getSection(error.range.start);
        this.title = `Добавить объявление секции ${error.data}`;
        this.edit = new WorkspaceEdit();
        this.edit.insert(error.getOwner().uri, new Position(section.startLine, 0), `[${error.data}]\n\n`); // TODO: Заменить на информацию из документации
    }
}