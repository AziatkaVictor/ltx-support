import { TextDocument, Range, Position } from "vscode";
import { Section } from "../sections/Index";
import { Parser } from "../shared/Parser";
import { SectionFactory } from "../factories/Section";

/**
 * Implementation of base *.ltx file, which will handle parsing basic declarations.
 */
export class Document {
    readonly sections: Section[]

    constructor(readonly source: TextDocument) {
        this.sections = this.findSections().map((value: Range) => {
            return SectionFactory.create(this, value);
        });
    }

    /**
     * Parse text with RegExp to find section declaration. With {@link parents} it will search to only sections with one of this parents.
     * It will call {@link Document.findSectionsDeclaration} function to find sections in this document. Comments will be ignored.
     * @param range where to search
     * @param parents sections with which parent sections must be founded
     * @returns array of {@link Range} in this document
     */
    public findSectionsDeclaration(range?: Range, parents?: string[]): Range[] {
        const text = this.source.getText(range);
        return Parser.toRanges(this.source, Document.findSectionsDeclaration(text, parents), range);
    }

    /**
     * Find all sections body in this document
     * @param range in which range to search
     * @returns where sections in text are located
     */
    public findSections(range?: Range): Range[] {
        const text = this.source.getText(range);
        return Parser.toRanges(this.source, Document.findSections(text), range);
    }

    /**
     * Get line on {@link Position} and checks that it is inside section declaration brackets, between `[]`.
     * @param position position of cursor
     * @returns is position inside
     */
    public isSectionDeclaration(position: Position): boolean {
        const lineText = this.source.lineAt(position.line).text;
        return lineText.indexOf("[") < position.character && lineText.lastIndexOf("]") >= position.character;
    }
}