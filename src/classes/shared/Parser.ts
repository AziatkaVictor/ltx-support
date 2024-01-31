import { isNumber } from "util";
import { TextDocument, Range } from "vscode";

/** 
 * Static class for parsing text with RegExp
*/
export class Parser {
    /**
     * Converts zero-base offsets into range with {@link TextDocument TextDocument}
     * @param document Source of text
     * @param matches Offsets, which must be converted in range
     * @param range Range which must be converted in offset
     * @returns Array of ranges in document
     */
    public static toRanges(document: TextDocument, matches: IMatch[], range?: Range): Range[] {
        const offset = range ? document.offsetAt(range.start) : 0;
        return matches.map((value: IMatch) => {
            return new Range(
                document.positionAt(offset + value.start),
                document.positionAt(offset + value.start + value.length)
            );
        });
    }

    public static toRange(document: TextDocument, match: IMatch, range?: Range): Range {
        const offset = range ? document.offsetAt(range.start) : 0;
        return new Range(
            document.positionAt(offset + match.start),
            document.positionAt(offset + match.start + match.length)
        );
    }
    
    /**
     * Find first element in text by given RegExp pattern
     * @param text Where to search
     * @param pattern Which RegExp pattern use
     * @returns Zero-based offsets with length
     */
    public static find(text: string, pattern: RegExp): IMatch | void {
        const result = pattern.exec(text);
        if (!isNumber(result?.index)) return;
        
        console.debug(pattern, result.index, "\n", result);
        return { start: result.index, length: result[0].length };
    }

    /**
     * Find all elements in text by given RegExp pattern
     * @param text Where to search
     * @param pattern Which RegExp pattern use
     * @returns Array of zero-based offsets with length
     */
    public static findAll(text: string, pattern: RegExp): IMatch[] | void {
        const result = [...text.matchAll(pattern)];
        if (result?.length <= 0) return;

        console.debug(pattern, "\n", result);

        return result.map((value: RegExpExecArray, index: number, array: RegExpExecArray[]) => {
            return { start: value.index, length: value[0].length };
        });
    }

    public static findRange(document: TextDocument, pattern: RegExp, range?: Range): Range {
        const text = document.getText(range);
        const result = Parser.find(text, pattern);

        if (!result) return;

        return Parser.toRange(document, result);
    }

    public static findAllRanges(document: TextDocument, pattern: RegExp, range?: Range): Range[] | void {
        const text = document.getText(range);
        const result = Parser.findAll(text, pattern);

        if (!result) return;

        return Parser.toRanges(document, result);
    }
}