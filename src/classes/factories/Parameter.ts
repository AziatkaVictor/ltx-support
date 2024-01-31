import { Range } from "vscode";
import { Document, Parameter, Parser, Section } from "../ltx";
import { AbstractFactory } from "./Abstract";


export class ParameterFactory implements AbstractFactory {
    static create(document: Document, parent: Section, range: Range): Parameter {
        const nameRange = Parser.findRange(document.source, Parameter.namePattern, range);

        if (!nameRange) {
            console.warn("Can't find parameter name in", `${document.source.fileName}:${range.start.line + 1}:${range.start.character + 1}`);
            return new Parameter(document, parent, range);
        }

        const name = document.source.getText(nameRange);
        return new Parameter(document, parent, range, name);
    }
}