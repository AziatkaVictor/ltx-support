import { DiagnosticSeverity, Range } from "vscode";
import { currentFile } from "./ltxDocument";
export var globalErrorsData: Map<string, LtxError[]> = new Map<string, LtxError[]>();

/**
 * Добавление ошибки в глобальный массив, лучше всего располагать под `isIgnoreParamsDiagnostic()`
 * @param range Положение ошибки в тексте
 * @param description Описание ошибки
 * @param element Имя элемента (необязательно)
 */
export function addError(range: Range, description: string, element?: string, errorType? : DiagnosticSeverity, tag? : string) {
    if (element) {
        description = element + ": " + description;
    }
    let temp = globalErrorsData.get(currentFile);
    if (!temp) {
        temp = []
    }
    temp.push(new LtxError(element, range, description, errorType, tag));
    globalErrorsData.set(currentFile, temp);
}

export class LtxError {
    data: string
    range: Range
    descr: string
    errorType: DiagnosticSeverity
    tag: string

    constructor(data: string, range: Range, descr: string, errorType = DiagnosticSeverity.Error, tag? : string) {
        this.data = data;
        this.range = range;
        this.descr = descr;
        this.errorType = errorType;
        this.tag = tag;
    }
}