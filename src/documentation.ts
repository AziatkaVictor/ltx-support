import { MarkdownString } from "vscode";
import { getFunctions, getConditions } from "./lua/actionsParser";
import { getUserDocumentation } from "./settings";

const docsPath = "../data/documentation/";
export const functionsFiles = new Map<string, Function>([["xr_effects", getFunctions], ["xr_conditions", getConditions]]);

/**
 * Типы документации. Нужно для упрощения работы с документацией, разделением на категории.
 */
export enum DocumentationKind {
    Functions = "xr_effects",
    Conditions = "xr_conditions",
    Property = "params",
    SectionsType = "sections"
}

/**
 * Возвращает всю документацию, на основе типа и названия
 * @param kind Тип документации
 * @param args Первое это название для файла, остальное по необходимости.
 * @returns 
 */
export function getDocumentationData(kind : DocumentationKind): Object|null {
    try {
        var docs = require(docsPath + kind + "_docs.json");
        var userDocs = getUserDocumentation(kind);
        return Object.assign({}, docs, userDocs);
    } catch (error) {   
        console.log(error);
        return;
    }
}

/**
 * Возвращает документацию, на основе названия и типа.
 * @param name Название эллемента, на основе которого нужна документация
 * @param kind Тип документации
 * @param hover Используеться для Hover? По умолчанию False.
 * @returns 
 */
export function getDocumentation(name : string, kind : DocumentationKind, hover : boolean = false) : MarkdownString {
    switch (kind) {
        case DocumentationKind.Functions: return getConditionFunctionDocumentation(name, hover);
        case DocumentationKind.Conditions: return getConditionFunctionDocumentation(name, hover);
        case DocumentationKind.Property: return getParamsDocumentation(name, hover);
    }
}

/**
 * Генерирует текст документации для {@link DocumentationKind.Functions} и {@link DocumentationKind.Conditions}
 */
function getConditionFunctionDocumentation(name : string, hover : boolean = false) : MarkdownString {
    var docs = getDocumentationData(getDocByFunction(name) as DocumentationKind);
    var text = new MarkdownString();
    text.isTrusted = true;
    text.supportHtml = true;
   
    if (!docs) {
        return text;
    }
    if (!docs[name]) {
        return text;
    }

    if (docs[name]['example'] && hover) {
        text.appendCodeblock(docs[name]['example'], "ltx");
        text.appendMarkdown("---\n")
    }
    text.appendMarkdown(docs[name]['documentation']);
    if (docs[name]['args'] && docs[name]['args'].length !== 0) {
        text.appendMarkdown("  \nArgs: " + docs[name]['args'].map((value : string) => {return `\`${value}\``}).join(", "));
    }
    return text;
}

function getParamsDocumentation(name : string, hover : boolean = false) {
    var text = new MarkdownString();
    var docs = getDocumentationData(DocumentationKind.Property);

    if (!docs) {
        return text;
    }
    if (!docs[name]) {
        return text;
    }

    if (docs[name]['example'] && hover) {
        text.appendCodeblock(docs[name]['example'], "ltx");
        text.appendMarkdown("---\n")
    }
    text.appendMarkdown(docs[name]['documentation']);
    return text;
}

/**
 * Возвращает имя файла, на основе функции
 * @param item Название функции
 * @returns Имя файла
 */
export function getDocByFunction(item : string) {
    for (let file of Array.from(functionsFiles.keys())) {
        if (functionsFiles.get(file)().indexOf(item) !== -1) {     
            return file;
        }
    }    
    return;
}