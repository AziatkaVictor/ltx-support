import * as fs from 'fs';
import * as path from 'path';
import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, Position, SnippetString, TextDocument, workspace } from "vscode";
import { getDocumentation, DocumentationKind } from "../documentation";
import { getLtxDocument } from "../extension";
import { LtxDocument, LtxDocumentType } from "../ltx/ltxDocument";
import { getPathToLocalization, getDefaultPathToLocalization, getPathToScripts, getDefaultPathToScripts } from "../settings";
import { analyzeFile, findLuaElements } from '../utils/fileReader';
import { getParamsByFile } from "../utils/modulesParser";

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

export async function provideLogicParams(document: TextDocument, position: Position, token?: CancellationToken, context?: CompletionContext): Promise<CompletionItem[] | undefined> {
    const data = getLtxDocument(document);
    if (!data.getSection(position)) {
        return;
    }
    if (canAddParam(document, position)) {
        return await getParams(data, position);
    }
    if (data.isInsideSignal(position)) {
        return await getSignals();
    }
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
    console.log(resultEnd);
    return resultEnd;
}

async function getParams(data: LtxDocument, position: Position) {
    const currentSection = data.getSection(position);
    var items = data.getType() !== LtxDocumentType.Logic ? data.getTypeParams() : currentSection.getParams();

    if (currentSection.getModuleType() === "stype_stalker" && !ignoreSections.includes(currentSection.getTypeName())) {
        items = items.concat((getParamsByFile("stalker_generic.script").concat(getParamsByFile("xr_logic.script"))));
    }
    if (currentSection.getTypeName() === "logic") {
        items = items.concat(getParamsByFile("gulag_general.script"));
    }

    return Array.from(new Set(items)).map((value) => {
        var name = value.split(":")[1];
        var type = value.split(":")[0];
        var item = new CompletionItem(name, CompletionItemKind.Enum);
        var Mark = getDocumentation(name, DocumentationKind.Property);
        item.documentation = Mark;
        item.detail = type;
        item.insertText = new SnippetString(paramSnippets[type].replace("{value}", name));
        return item;
    })
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