import { CancellationToken, DocumentSymbol, Location, Position, ProviderResult, SymbolInformation, SymbolKind, TextDocument, Range } from "vscode";
import { getLtxDocument } from "../extension";

export function provideSymbols(document: TextDocument, token: CancellationToken): ProviderResult<SymbolInformation[] | DocumentSymbol[]> {
    var data = getLtxDocument(document);
    var lines = []
    var sections = data.getSections().map(section => {
        Array.from(section.lines.values()).map(line => {
            lines.push(new SymbolInformation(line.propertyName, SymbolKind.Property, section.name, new Location(document.uri, new Range(new Position(line.index, 0), new Position(line.index, line.rawData.length - 1)))));
        })
        return new SymbolInformation(section.name, SymbolKind.Class, null, new Location(document.uri, new Range(new Position(section.startLine, 0), new Position(section.endLine + 1, 0))));
    })
    return sections.concat(lines);
}