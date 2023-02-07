import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, MarkdownString, Position, TextDocument, window, QuickPickItem } from "vscode";
import { getLtxDocument } from "../extension";
import { getConditions, getFunctions } from "../lua/actionsParser";
import { getUserArgsDocumentation, getUserDocumentation, setUserDocumentation } from "../settings";

const docsPath = "../../data/documentation/";
const files = new Map<string, Function>([["xr_effects", getFunctions],["xr_conditions", getConditions]]);

class functionPickItem implements QuickPickItem {
    label: string;
    description: string;

    constructor(description: string, name: string) {
        this.label = name;
        this.description = description;
    }
}

export async function provideLogicActions(document: TextDocument, position: Position, token?: CancellationToken, context?: CompletionContext): Promise<CompletionItem[] | undefined> {
    var data = getLtxDocument(document);
    if (data.isInsideArgumentsGroup(position)) {
        return;
    }

    if (data.isInsideFunctionGroup(position) && context.triggerCharacter !== "!") {
        return getLogicCompletionItems(getFunctions(), "xr_effects");
    }
    else if (data.isInsideConditionGroup(position)) {
        return getLogicCompletionItems(getConditions(), "xr_conditions");
    }
}

export async function addActionsDocumentnation() {
    try {
        var file = await pickFile(); 
        var docs = getUserDocumentation(file);
        var name = await pickFunction(docs, file);
        await checkDocs(docs, name);
        var descr = await writeDocumentation(docs, name);
        var args = await pickArguments(name);
        var example = await writeExample(docs, name);
    } catch (error) {
        console.error(error);
        return;
    }
    
    docs[name] = {
        "documentation" : descr.replace(/(<br>|\\n)/g, "\n"),
        "args" : args,
        "example" : example
    }
    setDocumentationFile(file, docs);
    window.showInformationMessage("Документация для функции '" + name + "' из файла '" + file + "' успешно добавлена!");
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

async function pickFile() {
    var file = await window.showQuickPick(Array.from(files.keys()), {placeHolder:"Выберите файл"});
    if (!file) {
        window.showErrorMessage("Операция прервана. Не был выбран файл.")
        throw new Error("File is not picked!");      
    }
    return file;
}

async function pickFunction(docs : Object, file : string) {
    var name : any = await window.showQuickPick(files.get(file)().sort().map((value) => { return new functionPickItem(docs[value] ? "Документация уже написана" : "", value);}), {placeHolder:"Выберите функцию", title : file}); 
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
    const doneButton = "[ Done ]";
    var args = [];
    var index = 0;

    while (true) {
        let argSelection = await window.showQuickPick(argsList.sort().concat(doneButton), {title:"Выбирите аргумент на позицию №" + (index + 1) + " для функции '" + name + "'. Нажмите " + doneButton + " чтобы закончить. Опционально."});
        if (!argSelection || argSelection === doneButton) {
            break;
        }
        args.push(argSelection);
        index++;
    }
    return args;
}

async function writeExample(docs : Object, name : string) {
    return await window.showInputBox({value:docs[name] ? docs[name]["example"] : "", placeHolder:"Например: =create_squad(esc_bandit_01_squad:esc_smart_bandit_base)", title:"Пример для функции '" + name + "'. Опционально."}); 
}

function getDocsFilename(item : string) {
    for (let file of Array.from(files.keys())) {
        if (files.get(file)().indexOf(item) !== -1) {     
            return file;
        }
    }    
    return;
}

export function getFunctionsDocumentation(functionName : string, hover : boolean = false) {
    var docs = getDocumentationFile(getDocsFilename(functionName));
    if (!docs) {
        return new MarkdownString();
    }
    if (!docs[functionName]) {
        return new MarkdownString();
    }

    var text = new MarkdownString();
    if (docs[functionName]['example'] && hover) {
        text.appendCodeblock(docs[functionName]['example'], "ltx");
        text.appendMarkdown("---\n")
    }
    text.appendMarkdown(docs[functionName]['documentation']);
    if (docs[functionName]['args'] && docs[functionName]['args'].length !== 0) {
        text.appendMarkdown("  \nArgs: " + docs[functionName]['args'].map((value : string) => {return `\`${value}\``}).join(", "));
    }
    return text;
}

function getLogicCompletionItems(items : string[], filename : string) : CompletionItem[] {
    return items.map((element : string) => {
        var item = new CompletionItem(element, CompletionItemKind.Function)
        item.detail = filename + "." + element;   
        var Mark = getFunctionsDocumentation(element);
        Mark.isTrusted = true;
        Mark.supportHtml = true;
        item.documentation = Mark;
        return item;
    });
}