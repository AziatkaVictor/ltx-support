import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, MarkdownString, Position, TextDocument, window } from "vscode";
import { getLtxDocument } from "../extension";
import { getConditions, getFunctions } from "../lua/actionsParser";
import { getUserArgsDocumentation, getUserDocumentation, setUserDocumentation } from "../settings";

const docsPath = "../../data/documentation/";
const files = new Map<string, Function>([["xr_effects", getFunctions],["xr_conditions", getConditions]]);

export async function provideLogicActions(document: TextDocument, position: Position, token?: CancellationToken, context?: CompletionContext): Promise<CompletionItem[] | undefined> {
    var data = getLtxDocument(document);
    
    if (data.isInsideFunctionGroup(position) && context.triggerCharacter !== "!") {
        return getLogicCompletionItems(getFunctions(), "xr_effects");
    }
    else if (data.isInsideConditionGroup(position)) {
        return getLogicCompletionItems(getConditions(), "xr_conditions");
    }
}

export async function addActionsDocumentnation() {
    var file = await window.showQuickPick(Array.from(files.keys()), {placeHolder:"Выберите файл"});
    if (!file) {
        window.showErrorMessage("Операция прервана. Не был выбран файл.")
        return;
    }
    var name = await window.showQuickPick(files.get(file)().sort(), {placeHolder:"Выберите функцию", title : file}); 
    if (!name) {
        window.showErrorMessage("Операция прервана. Не была выбрана функция для которой бы писалась документация.")
        return;
    }

    var docs = getUserDocumentation(file);    
    if (!docs) {
        docs = {};
    }
    else if (docs[name]) {
        var solution = await window.showQuickPick(["Yes", "No"], {title:"В пользовательской документации найдена функция `" + name + "`. Перезаписать её?"})
        if (!solution || solution === "No") {
            window.showErrorMessage("Операция прервана.")
            return;
        }
    }

    var descr = await window.showInputBox({placeHolder:"Напишите описание", title:"Документация для функции '" + name + "'", prompt:"Поддерживатся Markdown\nТекст"}); 
    if (!descr || descr.trim() === "") {
        window.showErrorMessage("Операция прервана. Описание не может быть пустым.")
        return;
    }

    const argsList = getUserArgsDocumentation();
    var argsDirty = await window.showQuickPick(argsList.sort(), {title:"Выбирите аргументы для функции `" + name + "`. После этого можно будет выбрать очерёдность аргументов.", canPickMany:true});
    var args = [];
    if (!argsDirty) {
        argsDirty = []
    }
    else if (argsDirty.length !== 0) {
        let index = 0;
        while (true) {
            if (argsDirty.length === 0) {
                break;
            }
            let argSelection = await window.showQuickPick(argsDirty, {title:"Выбирите аргумент на позицию №" + (index + 1) + " для функции `" + name + "`"});
            args.push(argSelection);
            argsDirty.splice(argsDirty.indexOf(argSelection), 1);
            index++;
        }
    }    

    docs[name] = {
        "documentation" : descr.replace(/(<br>|\\n)/g, "\n"),
        "args" : args
    }
    setDocumentationFile(file, docs);
    window.showInformationMessage("Документация для функции `" + name + "` из файла `" + file + "` успешно добавлена!");
}

function getDocumentationFile(name : string) {
    try {
        var docs = require(docsPath + name + "_docs.json");
        var userDocs = getUserDocumentation(name);
        return Object.assign({}, docs, userDocs);
    } catch (error) {   
        console.log(error);
        return;
    }
}

function setDocumentationFile(name : string, data) {
    setUserDocumentation(name, data);
}

function getLogicCompletionItems(items : string[], filename : string) : CompletionItem[] {
    return items.map((element : string) => {
        var item = new CompletionItem(element, CompletionItemKind.Function)
        item.detail = filename + "." + element;

        const docs = getDocumentationFile(filename);
        if (!docs) {
            return item;
        }
        if (!docs[element]) {
            return item;
        }
        
        var Mark : MarkdownString;
        if (docs[element]['args'] && docs[element]['args'].length !== 0) {
            Mark = new MarkdownString(docs[element]['documentation'] + "<hr>**Args:** " + docs[element]['args'].map(value => {return "`" + value + "`"}).toString() + "<hr>**Example:** `=" + element + "(" + docs[element]['args'].join(":") + ")`");
        }
        else {
            Mark = new MarkdownString(docs[element]['documentation']);
        }

        Mark.isTrusted = true;
        Mark.supportHtml = true;
        item.documentation = Mark;
        return item;
    });
}