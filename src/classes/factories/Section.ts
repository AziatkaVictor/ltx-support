import { Range } from "vscode";
import { Document } from "../documents/Index";
import { Section } from "../sections/Index";
import { AbstractFactory } from "./Abstract";
import { Parser } from "../shared/Parser";

export class SectionFactory implements AbstractFactory {
    static create(document: Document, range: Range): Section {
        const name = Parser.find(document.source.getText(range), Section.namePattern);

        console.assert(name, "Can't find section name in", `${document.source.fileName}:${range.start.line + 1}:${range.start.character + 1}`);
        return new Section(document, range);
    }
}