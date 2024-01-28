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
    public static toRange(document: TextDocument, matches: IMatch[], range?: Range): Range[] {
        const offset = range ? document.offsetAt(range.start) : 0;
        return matches.map((value: IMatch) => {
            return new Range(
                document.positionAt(offset + value.start),
                document.positionAt(offset + value.start + value.length)
            );
        });
    }

    /**
     * Find elements in text by given RegExp pattern
     * @param text Where to search
     * @param pattern Which RegExp patter use
     * @returns Array of zero-based offsets with length
     */
    public static findAll(text: string, pattern: RegExp): IMatch[] {
        const result = [...text.matchAll(pattern)];
        if (!result) return [];

        console.debug(pattern, "\n", result);

        return result.map((value: RegExpExecArray, index: number, array: RegExpExecArray[]) => {
            return { start: value.index, length: value[0].length };
        });
    }
}