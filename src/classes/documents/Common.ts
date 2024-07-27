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
        // Searching sections body
        const sectionsRanges = Parser.findAllRanges(this.source, Section.bodyPattern);
        if (sectionsRanges) {
            this.sections = sectionsRanges.map((value: Range) => {
                return SectionFactory.create(this, value);
            });
        }
    }

    /**
     * Must be overwrote in inherited classes
     * @param document 
     * @returns Can this class be used for this type of document
     */
    public static canBeCreated(document: TextDocument): boolean {
        return false;
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