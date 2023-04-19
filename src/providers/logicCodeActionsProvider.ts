import { TextDocument, Range, CodeAction, CodeActionKind, WorkspaceEdit, CancellationToken, CodeActionContext, ProviderResult, Selection, Position, TextEdit } from "vscode";
import { getLtxDocument } from "../extension";
import { LtxDocument } from "../ltx/ltxDocument";
import { LtxError } from "../ltx/ltxError";
import { getConditions, getFunctions } from "../utils/actionsParser";
import { getBasedConditions, getMostSimilar, getSectionData } from "../utils/modulesParser";

export const DiagnosticTag = {
    "ReplaceSectionToNil": [Action_ReplaceSectionToNil],
    "Remove": [Action_Remove],
    "InvalidSectionType": [Action_InvalidSectionType],
    "InvalidSectionLink": [Action_InvalidSectionLink, Action_RemoveSectionLink],
    "SelfSectionLink": [Action_RemoveSectionLink],
    "InvalidAction": [Action_InvalidAction],
    "InvalidParameter": [Action_InvalidParameter]
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
            result = result.concat(func(document, range, data, error));
        }     
        tags.push(error.tag);
    }
    return result;
}

function Action_ReplaceSectionToNil(document: TextDocument, range: Range, data: LtxDocument, error: LtxError): CodeAction[] {
    const fix = new CodeAction(`Заменить на nil`, CodeActionKind.QuickFix);
    fix.edit = new WorkspaceEdit();
    const section = data.getSection(error.range.start);
    var edits = [];
    for (const link of section.getLinks()) {
        edits.push(new TextEdit(new Range(link.start, link.end), "nil"));
    }
    fix.edit.set(document.uri, edits);
    fix.edit.delete(document.uri, new Range(error.range.start, new Position(error.range.end.line + 1, 0)));
    return [fix];
}

function Action_Remove(document: TextDocument, range: Range, data: LtxDocument, error: LtxError): CodeAction[] {
    const fix = new CodeAction(`Удалить`, CodeActionKind.QuickFix);
    fix.edit = new WorkspaceEdit();
    fix.edit.delete(document.uri, new Range(error.range.start, new Position(error.range.end.line + 1, 0)));
    return [fix];
}

function Action_InvalidSectionType(document: TextDocument, range: Range, data: LtxDocument, error: LtxError): CodeAction[] {
    var result = [];
    const section = data.getSection(error.range.start);
    for (const sectionType of getMostSimilar(section.name, 3, Array.from(getSectionData().keys()))) {
        const fix = new CodeAction(`Заменить на ${sectionType.name}`, CodeActionKind.QuickFix);
        fix.edit = new WorkspaceEdit();
        fix.edit.replace(document.uri, error.range, sectionType.name);
        result.push(fix);
    }
    return result;
}

function Action_InvalidSectionLink(document: TextDocument, range: Range, data: LtxDocument, error: LtxError): CodeAction[] {
    var result = [];
    const section = data.getSection(error.range.start);
    const fix = new CodeAction(`Добавить объявление секции ${error.data}`, CodeActionKind.QuickFix);
    fix.edit = new WorkspaceEdit();
    fix.edit.insert(document.uri, new Position(section.startLine, 0), `[${error.data}]\n\n`); // TODO: Заменить на информацию из документации
    result.push(fix);
    return result;
}

function Action_RemoveSectionLink(document: TextDocument, range: Range, data: LtxDocument, error: LtxError): CodeAction[] {
    const fix = new CodeAction(`Заменить на nil`, CodeActionKind.QuickFix);
    fix.edit = new WorkspaceEdit();
    fix.edit.replace(document.uri, error.range, "nil");
    return [fix];
}

function Action_InvalidAction(document: TextDocument, range: Range, data: LtxDocument, error: LtxError): CodeAction[] {
    var result = [];
    const type = data.isInsideCondition(error.range.start);
    for (const functionName of getMostSimilar(error.data, 3, type ? getConditions() : getFunctions())) {
        const fix = new CodeAction(`Заменить на ${functionName.name}`, CodeActionKind.QuickFix);
        fix.edit = new WorkspaceEdit();
        fix.edit.replace(document.uri, error.range, functionName.name);
        result.push(fix);
    }
    return result;
}

function Action_InvalidParameter(document: TextDocument, range: Range, data: LtxDocument, error: LtxError): CodeAction[] {
    var result = [];
    const section = data.getSection(error.range.start);
    for (const parapmName of getMostSimilar(error.data, 3, section ? section.getParams() : getBasedConditions())) {
        const fix = new CodeAction(`Заменить на ${parapmName.name.split(":")[1]}`, CodeActionKind.QuickFix);
        fix.edit = new WorkspaceEdit();
        fix.edit.replace(document.uri, error.range, parapmName.name.split(":")[1]);
        result.push(fix);
    }
    return result;
}