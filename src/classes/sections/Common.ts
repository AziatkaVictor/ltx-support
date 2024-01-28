import { Range } from "vscode"
import { Parameter } from "../parameters/Index"
import { Document } from "../documents/Index"

export class Section {
    static namePattern = /(?<=\[).+(?=\])/g
    static bodyPattern = /^[\t\ ]*\[[^\r\n]*\](?:\:.+)?(?:[\r\n ]*(?:[^[\r\n ]+(?!\[))?)*$/gm

    private declaration: Range
    private parameters: Parameter[]

    public static getNamePatternWithParents(parents: string[]): RegExp {
        return new RegExp(Section.namePattern.source + "\:[^\n]*?\b(" + parents.join("|") + ")\b)", "g")
    }

    constructor(private owner: Document, private range: Range) {

    }
}