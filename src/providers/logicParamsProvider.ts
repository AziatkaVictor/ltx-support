import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, Position, TextDocument } from "vscode";
import { getDocumentation, DocumentationKind } from "../documentation";
import { getLtxDocument } from "../extension";
import { LtxDocument, LtxDocumentType } from "../ltx/ltxDocument";
import { getParamsByFile } from "../utils/modulesParser";

const ignoreSections = ["hit", "death", "meet", "gather_items"];

export async function provideLogicParams(document: TextDocument, position: Position, token?: CancellationToken, context?: CompletionContext): Promise<CompletionItem[] | undefined> {
    const data = getLtxDocument(document);
    if (data.getSection(position) && !data.getLine(position).inInsideCondlist(position)) {
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
        return item;
    })
}