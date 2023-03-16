import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, Position, SnippetString, TextDocument } from "vscode";
import { getDocumentation, DocumentationKind } from "../documentation";
import { getLtxDocument } from "../extension";
import { LtxDocument, LtxDocumentType } from "../ltx/ltxDocument";
import { getParamsByFile } from "../utils/modulesParser";

const ignoreSections = ["hit", "death", "meet", "gather_items"];
const paramSnippets = {
    "cfg_get_number_and_condlist" : "{value} = ${1:100} | ${0}",
    "cfg_get_string_and_condlist" : "{value} = ${1:text} | ${0}",
    "cfg_get_npc_and_zone" : "{value} = ${1:npc} | ${2:zone} | ${0}",
    "cfg_get_condlist" : "{value} = ${0}",
    "cfg_get_string" : "{value} = ${1:idle}",
    "cfg_get_number" : "{value} = ${1:200}",
    "cfg_get_bool" : "{value} = ${1:true}"
}

export async function provideLogicParams(document: TextDocument, position: Position, token?: CancellationToken, context?: CompletionContext): Promise<CompletionItem[] | undefined> {
    const data = getLtxDocument(document);
    if (data.getSection(position) && !data.inInsideCondlist(position) && !data.isInsideSignal(position)) {
        return await getParams(data, position);
    }
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