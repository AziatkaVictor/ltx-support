import { Position, Range } from "vscode"
import { LtxCondlist } from "./ltxCondlist"
import { LtxSectionProperty } from "./ltxSectionProperty"
import { LtxSectionType } from "./ltxSectionType"
import { addSemantic, LtxSemantic, LtxSemanticDescription, LtxSemanticModification, LtxSemanticType } from "./ltxSemantic"


export class LtxLine {
    readonly index: number

    readonly propertyName: string
    readonly propertyRange: Range
    readonly propertySettings: LtxSectionProperty
    readonly isPropertyValid: boolean

    readonly rawData: string

    readonly condlists: LtxCondlist[] = []

    constructor(index: number, data: string, sectionType: LtxSectionType) {
        this.index = index;
        this.rawData = data;
        var param;

        try {
            // Поиск названия параметра, например on_info = nil. Тут параметр on_info
            let re = /^(\s*?)?[\w\$]+?(?=(\s*?)?\=)/gm;
            param = re.exec(data);
        } catch (error) {
            console.log(error);
            return null;
        }

        if (param) {
            // Указываем название и тип строки
            this.propertyName = param[0].trim();
            this.propertyRange = new Range(new Position(index, param.index), new Position(index, param.index + param[0].length))
            addSemantic(new LtxSemantic(LtxSemanticType.property, LtxSemanticModification.readonly, this.propertyRange, LtxSemanticDescription.signal, this.propertyName))

            if (sectionType) {
                if (sectionType.params.get(param[0].trim())) {
                    let property = sectionType.params.get(param[0].trim());
                    this.propertySettings = property;
                    this.isPropertyValid = true;
                }
                else {
                    this.isPropertyValid = false;
                }
            }
            var tempData = data + "\n";

            // Поиск всех сигналов
            if (this.rawData.indexOf("|") !== -1) {
                let search = /(?<=(\=|\|)).+?(?=\|)/g
                let match;
                while ((match = search.exec(this.rawData)) !== null) {
                    let tempRange = new Range(new Position(index, match.index), new Position(index, match.index + match[0].length))

                    if (match[0].trim().toLowerCase().indexOf("true") !== -1 || match[0].trim().toLowerCase().indexOf("false") !== -1) {
                        addSemantic(new LtxSemantic(LtxSemanticType.keyword, null, tempRange, LtxSemanticDescription.signal, match[0]))
                    }
                    else if (!isNaN(+(match[0].trim()))) {
                        addSemantic(new LtxSemantic(LtxSemanticType.number, null, tempRange, LtxSemanticDescription.signal, match[0]))
                    }
                    else {
                        addSemantic(new LtxSemantic(LtxSemanticType.string, null, tempRange, LtxSemanticDescription.signal, match[0]))
                    }

                    let tempReplace = " ".repeat(1 + match[0].length) + "=";
                    tempData = tempData.replace("=" + match[0] + "|", tempReplace);
                }
            }

            // Поиск всех condlist
            let re = /(?<=(\=|\,)).+?(?=(\,|\\n|$))/gm;
            let match;
            while ((match = re.exec(tempData)) !== null) {
                this.condlists.push(new LtxCondlist(index, match.index, match[0]));
            }
        }
        else {
            this.isPropertyValid = false;
        }
    }

    // TODO: Сделать проверку кондишина
    isValidConditions() {
        return true;
    }

    // TODO: Сделать проверку функций
    isValidFunctions() {
        return true;
    }

    IsValidParamSyntax() {
        try {
            let re = new RegExp(this.propertyName + "(\\s)?\=");
            let match = re.exec(this.rawData);
            if (!match) {
                return false;
            }
            return true;
        }
        catch (error) {
            console.log(error);
            return false;
        }
    }

    IsHasResult() {
        try {
            let match = /(?<=\=).+/.exec(this.rawData)
            if (!match) {
                return false;
            }
            return true;
        }
        catch (error) {
            console.log(error);
            return false;
        }
    }
}