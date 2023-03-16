import { Range } from "vscode";
import { currentFile } from "./ltxDocument";
export var globalSenmaticsData: Map<string, LtxSemantic[]> = new Map<string, LtxSemantic[]>();

/**
 * Добавляем подсветку синтаксиса в глобальный массив
 * @param element Элемент подсветки синтаксиса
 */
export function addSemantic(element: LtxSemantic) {
    let temp = globalSenmaticsData.get(currentFile);
    if (!temp) {
        temp = []
    }
    temp.push(element);
    globalSenmaticsData.set(currentFile, temp);
}

/**
 * Класс, который используется для подсветки синтаксиса.
 * 
 * @param type - enum, который характеризует тип (переменяя, функция)
 * @param modification - enum, который характеризует метод использования (объявление, ссылка)
 * @param description - enum, который я планирую использовать для анализа кода
 * @param range - Range, индексы начала и конца текста, который надо подсветить
 */
export class LtxSemantic {
    type: LtxSemanticType
    modification: LtxSemanticModification | null
    description?: LtxSemanticDescription
    text?: string
    range: Range

    constructor(type: LtxSemanticType, modification: LtxSemanticModification | null, range: Range, description?: LtxSemanticDescription, text?: string) {
        this.type = type;
        this.modification = modification;
        this.range = range;
        this.description = description;
        this.text = text;
    }
}

export enum LtxSemanticType {
    variable = "variable",
    function = "function",
    keyword = "keyword",
    class = "class",
    number = "number",
    string = "string",
    struct = "struct",
    property = "property",
    constant = "constant"
}

export enum LtxSemanticModification {
    declaration = "declaration",
    readonly = "readonly",
    definition = "definition",
    documentation = "documentation"
}

export enum LtxSemanticDescription {
    signal = "signal",
    info = "info",
    sectionLink = "sectionLink"
}