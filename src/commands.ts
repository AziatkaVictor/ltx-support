import { QuickPickItem, window, workspace } from "vscode";
import { DocumentationKind, functionsFiles, getDocumentationData } from "./documentation";
import { getGameCommands, isUseWorkspaceFolder, getAdditiveCommands, getGamePath, getUserArgsDocumentation, getUserDocumentation, setUserDocumentation } from "./settings";

const TYPES = new Map<string, Function>([["Functions", addFunctionDocumentnation]]);

class selectionItem implements QuickPickItem {
    label: string;
    description: string;

    constructor(description: string, name: string) {
        this.label = name;
        this.description = description;
    }
}

export async function startGame() {
    class gameStartChoise implements QuickPickItem {
        constructor(public label : string, public detail : string) {
        }
    }

    var options = getGameCommands();
    if (!options) {
        return;
    }

    var choise = await window.showQuickPick(options.map((value) => {return new gameStartChoise(value[0], value[1])}));
    if (!choise) {
        return;
    }

    var terminal = window.activeTerminal ? window.activeTerminal : window.createTerminal();
    terminal.show();

    if (isUseWorkspaceFolder()) {
        terminal.sendText("cd '" + workspace.workspaceFolders[0].uri.fsPath + "'");   
        terminal.sendText(getAdditiveCommands());
    }
    else {
        terminal.sendText("cd '" + getGamePath() + "'");
    }

    terminal.sendText(choise.detail);
}

export async function addDocumentation() {
    try {
        var type = await pickType();
        if (type) {
            await TYPES.get(type)();
        }        
    } catch (error) {
        console.log(error);
    }
}

async function pickType() {
    var type = await window.showQuickPick(Array.from(TYPES.keys()));
    if (!type) {
        window.showErrorMessage("Операция прервана. Не был выбран тип.")
        throw new Error("Type is not picked!");      
    }
    return type;
}

async function addFunctionDocumentnation() {
    try {
        var file = await pickFile(); 
        var docs = getDocumentationData(file as DocumentationKind);
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
    var name : any = await window.showQuickPick(functionsFiles.get(file)().sort().map((value) => { return new selectionItem(docs[value] ? "Документация уже написана" : "", value);}), {placeHolder:"Выберите функцию", title : file}); 
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