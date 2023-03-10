import { QuickPickItem, window, MarkdownString } from "vscode";
import { getFunctions, getConditions } from "./lua/actionsParser";
import { setUserDocumentation, getUserDocumentation, getUserArgsDocumentation } from "./settings";

const docsPath = "../data/documentation/";
const functionsFiles = new Map<string, Function>([["xr_effects", getFunctions], ["xr_conditions", getConditions]]);

/**
 * Типы документации. Нужно для упрощения работы с документацией, разделением на категории.
 */
export enum DocumentationKind {
    Functions,
    Property,
    SectionsType
}

function getDocumentationData(kind : DocumentationKind, name? : string) {
    switch (kind) {
        case DocumentationKind.Functions: return getFunctionsDocumentationData(name);
    }
}

function getFunctionsDocumentationData(name : string) : Object {
    try {
        var docs = require(docsPath + name + "_docs.json");
        var userDocs = getUserDocumentation(name);
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
 * @param hover Используеться для Hover?
 * @returns 
 */
export function getDocumentation(name : string, kind : DocumentationKind, hover : boolean = false) : MarkdownString {
    switch (kind) {
        case DocumentationKind.Functions: return getFunctionDocumentation(name, hover);
    }
}

/**
 * Генерирует текст документации для {@link DocumentationKind.Functions}
 */
function getFunctionDocumentation(name : string, hover : boolean = false) : MarkdownString {
    var docs = getDocumentationData(DocumentationKind.Functions, getDocByFunction(name));
   
    if (!docs) {
        return new MarkdownString();
    }
    if (!docs[name]) {
        return new MarkdownString();
    }

    var text = new MarkdownString();
    text.isTrusted = true;
    text.supportHtml = true;

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

class functionPickItem implements QuickPickItem {
    label: string;
    description: string;

    constructor(description: string, name: string) {
        this.label = name;
        this.description = description;
    }
}

export async function addFunctionDocumentnation() {
    try {
        var file = await pickFile(); 
        var docs = getDocumentationData(DocumentationKind.Functions, file);
        var name = await pickFunction(docs, file);
        await checkDocs(docs, name);
        var descr = await writeDocumentation(docs, name);
        var args = await pickArguments(name);
        var example = await writeExample(docs, name);
    } catch (error) {
        console.error(error);
        return;
    }
    
    docs = getUserDocumentation(file);
    docs[name] = {
        "documentation" : descr.replace(/(<br>|\\n)/g, "\n"),
        "args" : args,
        "example" : example
    }
    setUserDocumentation(file, docs);
    window.showInformationMessage("Документация для функции '" + name + "' из файла '" + file + "' успешно добавлена!");
}

async function pickFile() {
    var file = await window.showQuickPick(Array.from(functionsFiles.keys()), {placeHolder:"Выберите файл"});
    if (!file) {
        window.showErrorMessage("Операция прервана. Не был выбран файл.")
        throw new Error("File is not picked!");      
    }
    return file;
}

async function pickFunction(docs : Object, file : string) {
    var name : any = await window.showQuickPick(functionsFiles.get(file)().sort().map((value) => { return new functionPickItem(docs[value] ? "Документация уже написана" : "", value);}), {placeHolder:"Выберите функцию", title : file}); 
    if (!name) {
        window.showErrorMessage("Операция прервана. Не была выбрана функция для которой бы писалась документация.")
        throw new Error("Function is not picked!"); 
    }
    return name.label;
}

async function checkDocs(docs : Object, name : string) {
    if (!docs[name]) {
        return;
    }
    let solution = await window.showQuickPick(["Yes", "No"], {title:"В пользовательской документации найдена функция '" + name + "'. Перезаписать её?"})
    if (!solution || solution === "No") {
        window.showErrorMessage("Операция прервана.")
        throw new Error("Cancled!"); 
    }
}

async function writeDocumentation(docs : Object, name : string) {
    var descr = await window.showInputBox({value:docs[name] ? docs[name]["documentation"] : "", placeHolder:"Напишите описание", title:"Документация для функции '" + name + "'", prompt:"Поддерживатся Markdown"}); 
    if (!descr || descr.trim() === "") {
        window.showErrorMessage("Операция прервана. Описание не может быть пустым.")
        throw new Error("Description is null!"); 
    }
    return descr;
}

async function pickArguments(name : string) {
    const argsList = getUserArgsDocumentation();
    var args = [];
    var index = 0;
    while (true) {
        let argSelection = await window.showQuickPick(argsList.sort(), {title:"Выбирите аргумент на позицию №" + (index + 1) + " для функции '" + name + "'. Опционально.", canPickMany:true});
        if (!argSelection || argSelection.length === 0) {
            break;
        }
        args.push(argSelection.join("|"));
        index++;
    }
    return args;
}

async function writeExample(docs : Object, name : string) {
    return await window.showInputBox({value:docs[name] ? docs[name]["example"] : `=${name}`, placeHolder:"Например: =create_squad(esc_bandit_01_squad:esc_smart_bandit_base)", title:"Пример для функции '" + name + "'. Опционально."}); 
}

/**
 * Возвращает имя файла, на основе функции
 * @param item Название функции
 * @returns Имя файла
 */
function getDocByFunction(item : string) {
    for (let file of Array.from(functionsFiles.keys())) {
        if (functionsFiles.get(file)().indexOf(item) !== -1) {     
            return file;
        }
    }    
    return;
}