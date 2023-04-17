import { TextDocument, Range, CodeAction, CodeActionKind, WorkspaceEdit, CancellationToken, CodeActionContext, ProviderResult, Selection, Position, TextEdit } from "vscode";
import { getLtxDocument } from "../extension";
import { LtxDocument } from "../ltx/ltxDocument";
import { LtxError } from "../ltx/ltxError";

export const DiagnosticTag = {
    "ReplaceSectionToNil": [Action_ReplaceSectionToNil],
    "Remove": [Action_Remove],
    "InvalidSectionType": [Action_InvalidSectionType]
}

export function provideCodeActions(document: TextDocument, range: Range | Selection, context: CodeActionContext, token: CancellationToken): ProviderResult<CodeAction[]> {
    const data = getLtxDocument(document);
    var result = [];
    var tags = [];
    for (const error of data.getErrorsByPosition(range.start)) {
        if (!DiagnosticTag[error.tag] || tags.includes(error.tag)) {
            continue;
        }
        for (const func of DiagnosticTag[error.tag]) {
            result.push(func(document, range, data, error));
        }     
        tags.push(error.tag);
    }
    return result;
}

function Action_ReplaceSectionToNil(document: TextDocument, range: Range, data: LtxDocument, error: LtxError): CodeAction {
    const fix = new CodeAction(`Заменить на nil`, CodeActionKind.QuickFix);
    fix.edit = new WorkspaceEdit();
    const section = data.getSection(error.range.start);
    var edits = [];
    for (const link of section.getLinks()) {
        edits.push(new TextEdit(new Range(link.start, link.end), "nil"));
    }
    fix.edit.set(document.uri, edits);
    fix.edit.delete(document.uri, new Range(new Position(section.startLine, 0), new Position(section.endLine, document.lineAt(section.endLine).text.length)));
    return fix;
}

function Action_Remove(document: TextDocument, range: Range, data: LtxDocument, error: LtxError): CodeAction {
    const fix = new CodeAction(`Удалить секцию`, CodeActionKind.QuickFix);
    fix.edit = new WorkspaceEdit();
    fix.edit.delete(document.uri, new Range(error.range.start, new Position(error.range.end.line + 1, 0)));
    return fix;
}

function Action_InvalidSectionType(document: TextDocument, range: Range, data: LtxDocument, error: LtxError) {
    const sectionType = "sr_idle";
    const fix = new CodeAction(`Заменить на ${sectionType}`, CodeActionKind.QuickFix);
    fix.edit = new WorkspaceEdit();
    fix.edit.replace(document.uri, error.range, sectionType);
    return fix;
}