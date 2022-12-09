import { Position, Range } from "vscode";
import { sectionsArray } from "./ltxDocument";
import { LtxSectionLink } from "./ltxSectionLink";
import { addSemantic, LtxSemantic, LtxSemanticDescription, LtxSemanticModification, LtxSemanticType } from "./ltxSemantic";

export class LtxCondlist {
    readonly condition?;
    readonly conditionRange?: Range | null;
    readonly function?;
    readonly functionRange?: Range | null;
    readonly sectionLink?: LtxSectionLink;

    constructor(lineNumber: number, index: number, data: string) {
        let tempData = data;

        this.condition = /\{.*?\}/.exec(tempData);
        this.function = /\%.*?\%/.exec(tempData);

        if (this.condition) {
            this.conditionRange = new Range(new Position(lineNumber, index + this.condition.index), new Position(lineNumber, index + this.condition[0].length + this.condition.index));
        }
        if (this.function) {
            this.functionRange = new Range(new Position(lineNumber, index + this.function.index), new Position(lineNumber, index + this.function[0].length + this.function.index));
        }

        let search = /(\+|\-)\w*\b(?<=\w)/g
        let match;
        while ((match = search.exec(tempData)) !== null) {
            let tempRange = new Range(new Position(lineNumber, index + match.index), new Position(lineNumber, index + match.index + match[0].length))
            addSemantic(new LtxSemantic(LtxSemanticType.variable, LtxSemanticModification.declaration, tempRange, LtxSemanticDescription.info, match[0]))
            tempData = replaceText(tempData, match[0]);
        }

        search = /(\=|\!)\w*\b(?<=\w)/g
        while ((match = search.exec(tempData)) !== null) {
            let tempRange = new Range(new Position(lineNumber, index + match.index), new Position(lineNumber, index + match.index + match[0].length))
            addSemantic(new LtxSemantic(LtxSemanticType.function, LtxSemanticModification.declaration, tempRange, LtxSemanticDescription.signal, match[0]))
            tempData = replaceText(tempData, match[0]);
        }

        search = new RegExp("\\b(nil|true|false|complete|fail)\\b", "g")
        while ((match = search.exec(tempData)) !== null) {
            let tempRange = new Range(new Position(lineNumber, index + match.index), new Position(lineNumber, index + match.index + match[0].length))
            addSemantic(new LtxSemantic(LtxSemanticType.keyword, LtxSemanticModification.readonly, tempRange, LtxSemanticDescription.signal, match[0]))
            tempData = replaceText(tempData, match[0]);
        }

        search = /(?<!\w)\d+/g
        while ((match = search.exec(tempData)) !== null) {
            let tempRange = new Range(new Position(lineNumber, index + match.index), new Position(lineNumber, index + match.index + match[0].length))
            addSemantic(new LtxSemantic(LtxSemanticType.number, null, tempRange, LtxSemanticDescription.signal, match[0]))
            tempData = replaceText(tempData, match[0]);
        }

        for (let count = 0; count < sectionsArray.length; count++) {
            const sectionName = sectionsArray[count];
            search = new RegExp("(?<=\\b)" + sectionName + "(?![\\w\\@]+)(?=\\b)", "g")
            while ((match = search.exec(tempData)) !== null) {
                let tempRange = new Range(new Position(lineNumber, index + match.index), new Position(lineNumber, index + match.index + match[0].length))
                addSemantic(new LtxSemantic(LtxSemanticType.class, LtxSemanticModification.definition, tempRange, LtxSemanticDescription.signal, match[0]))
                tempData = replaceText(tempData, sectionName);
            }
        }

        search = /[\w\*\.\@\$]+/g
        while ((match = search.exec(tempData)) !== null) {
            let tempRange = new Range(new Position(lineNumber, index + match.index), new Position(lineNumber, index + match.index + match[0].length))
            addSemantic(new LtxSemantic(LtxSemanticType.string, null, tempRange, LtxSemanticDescription.signal, match[0]))
            tempData = replaceText(tempData, match[0]);
        }
    }
}

function replaceText(data, text) {
    let tempReplace = " ".repeat(text.length);
    return data.replace(new RegExp("(?<=\\b)\\" + text + "(?=\\b)"), tempReplace);
}