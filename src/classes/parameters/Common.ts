import { Range, TextDocument } from "vscode"
import { Condlist } from "../shared/Condlist"
import { Section } from "../sections/Index"

export class Parameter {
    private condlists: Condlist[]

    constructor(private owner: TextDocument, section: Section, range: Range) {}
}