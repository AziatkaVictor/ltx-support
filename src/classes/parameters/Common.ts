import { Range } from "vscode"
import { Condlist } from "../shared/Index"
import { Section } from "../sections/Index"
import { Document } from "../ltx";

export class Parameter {
    private condlists: Condlist[]

    constructor(readonly owner: Document, readonly section: Section, readonly range: Range, readonly name: string = "Can't find parameter name") {}

    public static get namePattern(): RegExp {
        return new RegExp(/(?<=^[\t ]*)[^\s]+?(?=[\t ]*\=[\t ]*.+?)/gm);
    }
}