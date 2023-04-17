import * as fs from 'fs';
import * as path from 'path';
import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, MarkdownString, Position, SnippetString, TextDocument, workspace } from "vscode";
import { DocumentationKind, getDocumentation } from "../documentation";
import { getLtxDocument } from "../extension";
import { LtxDocument, LtxDocumentType } from "../ltx/ltxDocument";
import { getDefaultPathToScripts, getPathToMisc, getPathToScripts } from "../settings";
import { getConditions, getFunctions } from "../utils/actionsParser";
import { analyzeFile, findLuaElements, getLocalizationData } from "../utils/fileReader";
import { getModules, getParamsByFile } from "../utils/modulesParser";

const ignoreSections = ["hit", "death", "meet", "gather_items"];
const paramSnippets = {
    "cfg_get_number_and_condlist": "{value} = ${1:100} | ${0}",
    "cfg_get_string_and_condlist": "{value} = ${1:text} | ${0}",
    "cfg_get_npc_and_zone": "{value} = ${1:npc} | ${2:zone} | ${0}",
    "cfg_get_condlist": "{value} = ${0}",
    "cfg_get_string": "{value} = ${1:idle}",
    "cfg_get_number": "{value} = ${1:200}",
    "cfg_get_bool": "{value} = ${1:true}"
}

export async function provideCompletion(document: TextDocument, position: Position, token?: CancellationToken, context?: CompletionContext): Promise<CompletionItem[]> {
    var data = getLtxDocument(document);
    var items : CompletionItem[] = [];

    // Sections
    if (data.getType() === LtxDocumentType.Trade) {
        if (data.canAddSectionLink(position)) {
            items = items.concat(await getSections(data, position));
        }
    }
    else if (data.getType() === LtxDocumentType.Logic) {
        if (isInsideSectionDefinition(document.lineAt(position.line).text, position) && isChar(context, ["["])) {
            items = items.concat(await getSectionsDefinitionTypes());
        }
        else if (data.canAddSectionLink(position)) {
            items = items.concat(await getSections(data, position));
        } 
    }

    // Params
    if (data.getSection(position)) {  
        if (canAddParam(document, position)) {
            items = items.concat(await getParams(data, position));
        }
        else if (data.isInsideSignal(position)) {
            items = items.concat(await getSignals());
        }
    }

    // Assets
    if (data.isInsideArgumentsGroup(position) && isChar(context, ["(", ":"])) {
        items = items.concat(await getSquads(document));
        items = items.concat(await getTasks(document));
        items = items.concat(await getKeywords(data));  
        items = items.concat(await getLocalization());   
    }
    else {  
        // Functions
        if (data.isInsideFunction(position) && isChar(context, ["="])) {
            items = items.concat(await getLogicCompletionItems(getFunctions(), "xr_effects"));
        }
        else if (data.isInsideCondition(position) && isChar(context, ["=", "!"])) {
            items = items.concat(await getLogicCompletionItems(getConditions(), "xr_conditions"));
        }

        // Info
        if (data.isInsideCondlistGroups(position) && isChar(context, ["+", "-"])) {
            items = items.concat(await getInfos(data));
        }

        // Keywords and Localization
        if (!data.isInsideCondlistGroups(position) && data.inInsideCondlist(position)) {
            if (data.getLine(position).getType() === "cfg_get_bool" || null) {
                items = items.concat(await getKeywords(data));            
            }
            if (data.getLine(position).getType() === "cfg_get_string" || null) {
                items = items.concat(await getLocalization());            
            }
        }
    }

    return items;
}


function isChar(context: CompletionContext, chars: string[]) {
    if (context.triggerCharacter) {
        return chars.includes(context.triggerCharacter);
    }
    return true;
}

async function getLogicCompletionItems(items : string[], filename : string) {
    return await Promise.all(items.map(async (element : string) => {
        var item = new CompletionItem(element, CompletionItemKind.Function)
        item.detail = filename + "." + element;   
        var Mark = await getDocumentation(element, filename as DocumentationKind);
        item.documentation = Mark;
        return item;
    }));
}

async function getSquads(document: TextDocument) : Promise<CompletionItem[]> {
    var items = [];
    var files = await workspace.findFiles('{' + getPathToMisc() + 'squad_descr_*.ltx,' + getPathToMisc() + 'squad_descr.ltx}', document.uri.fsPath);
    for await (const file of files) {
        var items = [];
        for await (const section of new LtxDocument(file).getSections()) {
            var item = new CompletionItem(section.name, CompletionItemKind.User);
            item.detail = "Squad";
            item.documentation = new MarkdownString("").appendCodeblock(section.getText(), "ltx");
            items.push(item);
        }
    }
    return items;
}

async function getTasks(document: TextDocument) : Promise<CompletionItem[]> {
    var items = [];
    var files = await workspace.findFiles('{' + getPathToMisc() + 'tm_*.ltx}', document.uri.fsPath);
    for await (const file of files) {
        for await (const section of new LtxDocument(file).getSections()) {
            var item = new CompletionItem(section.name, CompletionItemKind.Event);
            item.detail = "Task"
            item.documentation = new MarkdownString("").appendCodeblock(section.getText(), "ltx");
            items.push(item);
        }
    }
    return items;
}

async function getKeywords(document : LtxDocument): Promise<CompletionItem[]> {
    var items = ["nil","true","false"];
    if (document.getType() === LtxDocumentType.Tasks) {
        items.push("complete", "fail", "reversed");
    }
    return items.map((value) => {
        var item = new CompletionItem(value, CompletionItemKind.Keyword);
        return item;
    })
}

async function getLocalization(): Promise<CompletionItem[]> {
    return (await getLocalizationData()).map(value => {
        let item = new CompletionItem(value.$.id, CompletionItemKind.Variable);
        item.documentation = value.text[0];
        item.detail = "Localization"
        return item;
    });
}

async function getInfos(data: LtxDocument) : Promise<CompletionItem[]> {
    return Array.from(new Set(data.getInfos())).map((item) => {return new CompletionItem(item, CompletionItemKind.Constant);})
}

function canAddParam(document: TextDocument, position: Position): boolean {
    var re = /^(\s*?)?[\w\$]*?(\s*?)?(?=(\=|$|;))/gm;
    var text = document.lineAt(position.line).text;
    if (!text) {
        return true;
    }
    var match = re.exec(text);
    if (!match) {
        return false;
    }
    var resultEnd = match.index <= position.character && (match.index + match[0].length) >= position.character;
    return resultEnd;
}

async function getParams(data: LtxDocument, position: Position) {
    const currentSection = data.getSection(position);
    var items = data.getType() !== LtxDocumentType.Logic ? data.getTypeParams() : currentSection.getParams();

    if (currentSection.getModuleType() === "stype_stalker" && !ignoreSections.includes(currentSection.getTypeName())) {
        items = items.concat(getParamsByFile("stalker_generic.script"));
        items = items.concat(getParamsByFile("xr_logic.script"));
    }
    if (currentSection.getTypeName() === "logic") {
        items = items.concat(getParamsByFile("gulag_general.script"));
    }

    return await Promise.all(Array.from(new Set(items)).map(async (value) => {
        var name = value.split(":")[1];
        var type = value.split(":")[0];
        var item = new CompletionItem(name, CompletionItemKind.Enum);
        var Mark = await getDocumentation(name, DocumentationKind.Property);
        item.documentation = Mark;
        item.detail = type;
        if (!data.getLine(position) || data.getLine(position).condlists.length === 0) {
            item.insertText = new SnippetString(paramSnippets[type].replace("{value}", name));
        }
        return item;
    }));
}

async function getSignals() {
    var user = (await workspace.findFiles(getPathToScripts() + '*.script')).map(value => {return value.fsPath.split("\\")[value.fsPath.split("\\").length - 1]});
    var storage = fs.readdirSync(path.resolve(__dirname, getDefaultPathToScripts()));
    var files = Array.from(new Set(storage.concat(user)));
    var data = [];

    for (const file of files) {
        data = data.concat(analyzeFile(file, getPathToScripts(), getDefaultPathToScripts(), findSignals));
    }

    return Array.from(new Set(data)).map(value => {
        let item = new CompletionItem(value, CompletionItemKind.Constant);
        item.detail = "Signal"
        return item;
    });
}

function findSignals(filePath: string): string[] {
    return findLuaElements(filePath, /(?<=signals\[\")\w+(?=\"\])/g, (match) => {
        return match[0];
    })
}

async function getSections(data: LtxDocument, position : Position) : Promise<CompletionItem[]> {
    var items = [];
    var currentSection = data.getSection(position).name;
    for await (const section of Array.from(new Set(data.getSectionsName()))) {
        if (section !== currentSection) {
            items.push(new CompletionItem(section, CompletionItemKind.Class));
        }
    }
    return items;
}

function isInsideSectionDefinition(text : string, position : Position) : boolean {
    if (text === "") {
        return false;
    }
    if (text.indexOf("[") < position.character && text.indexOf("]") > position.character - 1) {
        return true;
    }
    return false;
}

async function getSectionsDefinitionTypes(): Promise<CompletionItem[]> {
    return await Promise.all(getModules().map(async (value) => {
        var item = new CompletionItem(value.split(":")[0], CompletionItemKind.Class);
        item.detail = "Section";
        item.documentation = await getDocumentation(value.split(":")[0], DocumentationKind.SectionsType);
        return item;
    }));
}
