import { MarkdownString, window } from "vscode";
import { getFunctions, getConditions } from "./utils/actionsParser";
import { getDefaultPathToGit, getUserDocumentation } from "./settings";
import axios from 'axios';
import * as path from 'path';
import * as fs from 'fs';
import { findLocalization } from "./utils/fileReader";

const docsPath = "../data/documentation/";
export const functionsFiles = new Map<string, Function>([["xr_effects", getFunctions], ["xr_conditions", getConditions]]);

/**
 * Типы документации. Нужно для упрощения работы с документацией, разделением на категории.
 */
export enum DocumentationKind {
    Functions = "xr_effects",
    Conditions = "xr_conditions",
    Property = "params",
    SectionsType = "sections",
    Variable = "varible"
}

/**
 * Возвращает всю документацию, на основе типа и названия
 * @param kind Тип документации
 * @returns 
 */
export function getDocumentationData(kind: DocumentationKind): Object | null {
    try {
        var docs = JSON.parse(fs.readFileSync(path.resolve(__dirname, docsPath + kind + "_docs.json")).toString());
        var userDocs = getUserDocumentation(kind);
        return Object.assign({}, docs, userDocs);
    } catch (error) {
        console.log(error);
        return {};
    }
}

/**
 * Возвращает документацию, на основе названия и типа.
 * @param name Название эллемента, на основе которого нужна документация
 * @param kind Тип документации
 * @param hover Используеться для Hover? По умолчанию False.
 * @returns 
 */
export async function getDocumentation(name: string, kind: DocumentationKind, hover: boolean = false): Promise<MarkdownString> {
    switch (kind) {
        case DocumentationKind.Functions: return getConditionFunctionDocumentation(name, hover, DocumentationKind.Functions);
        case DocumentationKind.Conditions: return getConditionFunctionDocumentation(name, hover, DocumentationKind.Conditions);
        case DocumentationKind.Property: return getParamsDocumentation(name, hover);
        case DocumentationKind.SectionsType: return getSectionDocumentation(name, hover);
        case DocumentationKind.Variable: return getVaribleDocumentation(name);
    }
}

async function getVaribleDocumentation(name: string) {
    const item = await findLocalization(name);
    if (!item) {
        return new MarkdownString();
    }
    var text = new MarkdownString("`Локализация:`\n\n" + item.text[0]);
    text.isTrusted = true;
    text.supportHtml = true;
    return text;
}

/**
 * Генерирует текст документации для {@link DocumentationKind.Functions} и {@link DocumentationKind.Conditions}
 */
function getConditionFunctionDocumentation(name: string, hover: boolean = false, file?: string): MarkdownString {
    var docs = getDocumentationData((file ? file : getDocByFunction(name)) as DocumentationKind);
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
        text.appendMarkdown("  \nArgs: " + docs[name]['args'].map((value: string) => { return `\`${value}\`` }).join(", "));
    }
    return text;
}

function getParamsDocumentation(name: string, hover: boolean = false) {
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

function getSectionDocumentation(name: string, hover: boolean = false) {
    var text = new MarkdownString();
    var docs = getDocumentationData(DocumentationKind.SectionsType);

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
export function getDocByFunction(item: string) {
    for (let file of Array.from(functionsFiles.keys())) {
        if (functionsFiles.get(file)().indexOf(item) !== -1) {
            return file;
        }
    }
    return;
}

export function updateDocumentation() {
    for (const file of ['params_docs.json', 'xr_conditions_docs.json', 'xr_effects_docs.json']) {
        updateDocumentationFile(file);
    }
    window.showInformationMessage("Документация была обновлена!")
}

async function updateDocumentationFile(file: string) {
    const url = getDefaultPathToGit() + file;
    try {
        const filepath = path.resolve(__dirname, docsPath + file);
        const response = await axios.get(url);
        if (response.status !== 200) {
            throw new Error("Error while trying to get data. Status: " + response.status)
        }
        fs.writeFileSync(filepath, JSON.stringify(response.data));
    } catch (exception) {
        window.showErrorMessage(`Документация для файла ${file} не была обновлена! ${exception}`);
        console.log(`ERROR received from ${url}: ${exception}\n`);
    }
}