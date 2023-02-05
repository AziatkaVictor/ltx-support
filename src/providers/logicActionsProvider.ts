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

    var descr = await window.showInputBox({placeHolder:"Напишите описание", title:"Документация для функции '" + name + "'", prompt:"Поддерживатся Markdown"}); 
    if (!descr || descr.trim() === "") {
        window.showErrorMessage("Операция прервана. Описание не может быть пустым.")
        return;
    }

    const argsList = getUserArgsDocumentation();
    const doneButton = "[ Done ]";
    var args = [];
    let index = 0;
    while (true) {
        let argSelection = await window.showQuickPick(argsList.sort().concat(doneButton), {title:"Выбирите аргумент на позицию №" + (index + 1) + " для функции `" + name + "`. Нажмите `" + doneButton + "` чтобы закончить. Опционально."});
        if (!argSelection || argSelection === doneButton) {
            break;
        }
        args.push(argSelection);
        index++;
    }

    var example = await window.showInputBox({placeHolder:"Напишите пример, например: =create_squad(esc_bandit_01_squad:esc_smart_bandit_base)", title:"Пример для функции '" + name + "'. Опционально."}); 
    docs[name] = {
        "documentation" : descr.replace(/(<br>|\\n)/g, "\n"),
        "args" : args,
        "example" : example
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

        var text : string = docs[element]['documentation'];
        if (docs[element]['args'] && docs[element]['args'].length !== 0) {
            text += "<hr>Args: " + docs[element]['args'].map(value => {return "`" + value + "`"}).join(", ");
        }
        if (docs[element]['example']) {
            text += "<hr>Example: `" + docs[element]['example'] + "`";
        }
        
        var Mark = new MarkdownString(text);
        Mark.isTrusted = true;
        Mark.supportHtml = true;
        item.documentation = Mark;
        return item;
    });
}