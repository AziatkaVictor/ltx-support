import { QuickPickItem, window, workspace } from "vscode";
import { DocumentationKind, functionsFiles, getDocumentationData } from "./documentation";
import { getAllParams, getModules } from "./utils/modulesParser";
import { getGameCommands, isUseWorkspaceFolder, getAdditiveCommands, getGamePath, getUserArgsDocumentation, getUserDocumentation, setUserDocumentation, isSilentStart } from "./settings";

const TYPES = new Map<string, Function>([
    ["Functions", addFunctionDocumentnation],
    ["Properties", addParamsDocumentnation],
    ["Sections", addSectionsDocumentnation]
]);

class selectionItem implements QuickPickItem {
    constructor(public description: string, public label: string) {}
}

export async function startGame() {
    var options = getGameCommands();
    if (!options) {return;   }
    var choise = await window.showQuickPick(options.map((value) => {return new selectionItem(value[1], value[0])}));
    if (!choise) {return;}

    var terminal = window.activeTerminal ? window.activeTerminal : window.createTerminal();
    if (!isSilentStart()) {
        terminal.show();
    }

    if (isUseWorkspaceFolder()) {
        terminal.sendText("cd '" + workspace.workspaceFolders[0].uri.fsPath + "'");   
        terminal.sendText(getAdditiveCommands());
    }
    else {
        terminal.sendText("cd '" + getGamePath() + "'");
    }
    terminal.sendText(choise.label);
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
        var name = await pickOption(docs, functionsFiles.get(file)().sort());
        await checkDocs(docs, name, "В пользовательской документации найдена функция '" + name + "'. Перезаписать её?");
        var descr = await writeDocumentation(docs, name);
        var args = await pickArguments(name);
        var example = await writeExample(docs, name, `=${name}`);
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

async function addParamsDocumentnation() {
    try {
        var docs = getDocumentationData(DocumentationKind.Property);
        var name = await pickOption(docs, getAllParams());
        await checkDocs(docs, name, "В пользовательской документации найден параметр '" + name + "'. Перезаписать его?");
        var descr = await writeDocumentation(docs, name);
        var example = await writeExample(docs, name, `${name} = `);
    } catch (error) {
        console.error(error);
        return;
    }

    docs = getUserDocumentation(DocumentationKind.Property);
    docs[name] = {
        "documentation" : descr.replace(/(<br>|\\n)/g, "\n"),
        "example" : example
    }
    setUserDocumentation(DocumentationKind.Property, docs);
    window.showInformationMessage("Документация для  '" + name + "' успешно добавлена!");
}

async function addSectionsDocumentnation() {
    try {
        var docs = getDocumentationData(DocumentationKind.SectionsType);
        var name = await pickOption(docs, getModules().map((value: string) => {return value.split(":")[0]}).sort());
        await checkDocs(docs, name, "В пользовательской документации найдена секция '" + name + "'. Перезаписать её?");
        var descr = await writeDocumentation(docs, name);
        var example = await writeExample(docs, name, `[${name}]\nparam = nil`);
    } catch (error) {
        console.error(error);
        return;
    }

    docs = getUserDocumentation(DocumentationKind.SectionsType);
    docs[name] = {
        "documentation" : descr.replace(/(<br>|\\n)/g, "\n"),
        "example" : example
    }
    setUserDocumentation(DocumentationKind.SectionsType, docs);
    window.showInformationMessage("Документация для  '" + name + "' успешно добавлена!");
}

async function pickFile() {
    var file = await window.showQuickPick(Array.from(functionsFiles.keys()), {placeHolder:"Выберите файл"});
    if (!file) {
        window.showErrorMessage("Операция прервана. Не был выбран файл.")
        throw new Error("File is not picked!");      
    }
    return file;
}

async function pickOption(docs : Object, options : string[]) {
    var name : any = await window.showQuickPick(options.map((value) => { return new selectionItem(docs[value] ? "Документация уже написана" : "", value);}), {placeHolder:"Выберите опцию"}); 
    if (!name) {
        window.showErrorMessage("Операция прервана. Не было выбрано для чего добавить документацию.")
        throw new Error("Option is not picked!"); 
    }
    return name.label;
}

async function checkDocs(docs : Object, name : string, title : string) {
    if (!docs[name]) {
        return;
    }
    let solution = await window.showQuickPick(["Yes", "No"], {title : title})
    if (!solution || solution === "No") {
        window.showErrorMessage("Операция прервана.")
        throw new Error("Cancled!"); 
    }
}

async function writeDocumentation(docs : Object, name : string) {
    var descr = await window.showInputBox({value:docs[name] ? docs[name]["documentation"] : "", title:"Напишите описание", prompt:"Поддерживатся Markdown"}); 
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

async function writeExample(docs : Object, name : string, example : string) {
    return await window.showInputBox({value:docs[name] ? docs[name]["example"] : example, placeHolder:"Например: =create_squad(esc_bandit_01_squad:esc_smart_bandit_base)", title:"Пример для функции '" + name + "'. Опционально."}); 
}