import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, Position, TextDocument } from "vscode";
import { getDocumentation, DocumentationKind } from "../documentation";
import { getLtxDocument } from "../extension";
import { LtxDocument, LtxDocumentType } from "../ltx/ltxDocument";
import { getParamsByFile, getSectionType } from "../lua/modulesParser";

const ignoreSections = ["hit", "death", "meet", "gather_items"];

export async function provideLogicParams(document: TextDocument, position: Position, token?: CancellationToken, context?: CompletionContext): Promise<CompletionItem[] | undefined> {
    const data = getLtxDocument(document);
    if (data.getSection(position) && !data.getLine(position).inInsideCondlist(position)) {
        return await getParams(data, position);
    }
}

async function getParams(data: LtxDocument, position : Position) {
    const currentSection = data.getSection(position);
    var items = data.getType() !== LtxDocumentType.Logic ? getParamsByFile(data.getType()).map((value) => {return value.split(":")[1]}) : currentSection.type.getParams();
   
    if (getSectionType(currentSection.type.name) == "stype_stalker" && !ignoreSections.includes(currentSection.type.name)) {
        items = items.concat((getParamsByFile("stalker_generic.script").concat(getParamsByFile("xr_logic.script"))).map((value) => {return value.split(":")[1]}))
    }  
    if (currentSection.type.name === "logic") {
        items = items.concat(getParamsByFile("gulag_general.script").map((value) => {return value.split(":")[1]}));
    }

    return Array.from(new Set(items)).map((value) => {
        var item = new CompletionItem(value, CompletionItemKind.Enum);
        var Mark = getDocumentation(value, DocumentationKind.Property);
        item.documentation = Mark;
        return item; 
    })
}