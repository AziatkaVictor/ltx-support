import { TextDocument, Range } from "vscode";
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
        return Parser.toRange(this.source, Document.findSectionsDeclaration(text, parents), range);
    }

    /**
     * Parse text with RegExp to find section declaration. With {@link parents} it will search to only sections with one of this parents. 
     * @param text string, which must to be parsed
     * @param parents sections with which parent sections must be founded
     * @returns array of offsets in text
     */
    public static findSectionsDeclaration(text: string, parents: string[] = []): IMatch[] {
        const pattern: RegExp = parents.length == 0 ? Section.namePattern : Section.getNamePatternWithParents(parents);
        return Parser.findAll(text, pattern);
    }

    public findSections(range?: Range): Range[] {
        const text = this.source.getText(range);
        return Parser.toRange(this.source, Document.findSections(text), range);
    }

    public static findSections(text: string): IMatch[] {
        return Parser.findAll(text, Section.bodyPattern);
    }
}