import { TextDocument, Range, Position } from "vscode";

export class Document {
    private sectionsDeclaration: Range[];

    constructor(readonly source: TextDocument) {
        const text = this.source.getText().replace(/;.*/g, '');
        this.sectionsDeclaration = Document.findSectionsDeclaration(text);
    }

    static findSectionsDeclaration(text: string, range?: Range, parents?: string[]): Range[] {
        const sectionRegExp: RegExp = /(?<=\[).+(?=\])/g;
        const sectionRegExpWithParents: RegExp = new RegExp("(?<=\\[).+(?=\\]\:.*?(" + parents.join("|") + "))", "g");
        const regExp: RegExp = !parents ? sectionRegExp : sectionRegExpWithParents;

        var match: RegExpExecArray;
        var sectionsArray = [];

        while (match = regExp.exec(text)) {
            let lineIndex = (text.substring(0, match.index).match(/\n/g) || []).length || 0;
            let start = new Position(lineIndex, match.index + 1);
            let end = new Position(lineIndex, start.character + match[0].length);
            sectionsArray.push(new Range(start, end));
        }
        return sectionsArray;
    }
}