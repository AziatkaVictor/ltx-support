import { Range } from "vscode"
import { Parameter } from "../parameters/Index"
import { Document } from "../documents/Index"

export class Section {
    private declaration: Range
    private parameters: Parameter[]
    

    static get namePattern() {
        return new RegExp(/(?<=\[).+(?=\])/g);
    }

    static get bodyPattern() {
        return new RegExp(/^[\t\ ]*\[[^\r\n]*\](?:\:.+)?(?:[\r\n ]*(?:[^[\r\n ]+(?!\[))?)*$/gm);
    }
    
    public get range(): Range {
        return this._range;
    }   

    public static getNamePatternWithParents(parents: string[]): RegExp {
        return new RegExp(Section.namePattern.source + "\:[^\n]*?\b(" + parents.join("|") + ")\b)", "g")
    }
    
}