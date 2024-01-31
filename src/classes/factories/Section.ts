import { Range } from "vscode";
import { Document } from "../documents/Index";
import { Section } from "../sections/Index";
import { AbstractFactory } from "./Abstract";
import { Parser } from "../shared/Parser";

export class SectionFactory implements AbstractFactory {
    static create(document: Document, range: Range): Section {
        const nameRange = Parser.find(document.source.getText(range), Section.namePattern);

        if (!nameRange) {
            console.warn("Can't find section name in", `${document.source.fileName}:${range.start.line + 1}:${range.start.character + 1}`);
            return new Section(document, range);
        }
        
        const RANGE = Parser.toRange(document.source, nameRange, range);
        const name = document.source.getText(RANGE);
        return new Section(document, range, name);
    }
}