import { CodeAction, CodeActionKind } from "vscode";
import { LtxError } from "./ltxError";

export abstract class LtxCodeAction extends CodeAction {
    constructor(error: LtxError) {
        super("BaseError Title", CodeActionKind.QuickFix);
    }
}