import { Range } from "vscode"
import { Parameter } from "../parameters/Index"
import { Document } from "../documents/Index"
import { ParameterFactory, Parser } from "../ltx"

export class Section {
    private declaration: Range
    private parameters: Parameter[]
    
    constructor(private owner: Document, private _range: Range, readonly name: string = "Error") {
        const lines = Parser.findAllRanges(this.owner.source, /^[^\r\n\[\]]+$/gm, this.range); 
        if (lines) {
            this.parameters = lines.map((value: Range, index: number, array: Range[]) => {
                return ParameterFactory.create(this.owner, this, value);
            });
        }
    }

    static get namePattern() {
        return new RegExp(/(?<=\[).+(?=\])/g);
    }

    static get bodyPattern() {
        return new RegExp(/^[\t\ ]*\[[^\r\n]*\](?:\:.+)?(?:[\r\n ]*(?:[^[\r\n ]+(?!\[))?)*$/gm);
    }
    
    public get range(): Range {
        return this._range;

    public get lastParameterLine(): number {
        return Math.max(...this.parameters.map((value: Parameter, index: number, array: Parameter[]) => {
            return value.range.start.line;
        }));
    }   

    public static getNamePatternWithParents(parents: string[]): RegExp {
        return new RegExp(Section.namePattern.source + "\:[^\n]*?\b(" + parents.join("|") + ")\b)", "g")
    }
    
}