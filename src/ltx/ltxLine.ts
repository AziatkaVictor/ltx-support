import { Position, Range } from "vscode"
import { isIgnoreParamsDiagnostic } from "../settings"
import { LtxCondlist } from "./ltxCondlist"
import { addError } from "./ltxError"
import { LtxSectionProperty } from "./ltxSectionProperty"
import { addSemantic, LtxSemantic, LtxSemanticDescription, LtxSemanticModification, LtxSemanticType } from "./ltxSemantic"


export class LtxLine {
    readonly index: number

    readonly propertyName: string
    readonly propertyRange: Range
    readonly propertySettings: LtxSectionProperty
    readonly isPropertyValid: boolean

    readonly rawData: string

    readonly condlists: LtxCondlist[] = []

    inInsideCondlist(position : Position) {
        for (let index = 0; index < this.condlists.length; index++) {
            const condlist = this.condlists[index];
            if (condlist.isInside(position)) {
                return true;
            }
        }
        return false;
    }

    constructor(index: number, data: string) {
        this.index = index;
        this.rawData = data;
        var param;

        try {
            // Поиск названия параметра
            let re = /^(\s*?)?[\w\$]+?(?=(\s*?)?\=)/gm;
            param = re.exec(data);
        } catch (error) {
            console.log(error);
            return;
        }

        if (param) {
            // Указываем название и тип строки
            this.propertyName = param[0].trim();
            this.propertyRange = new Range(new Position(index, param.index), new Position(index, param.index + param[0].length))
            addSemantic(new LtxSemantic(LtxSemanticType.property, LtxSemanticModification.readonly, this.propertyRange, LtxSemanticDescription.signal, this.propertyName))
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

    private diagnosticLine() {
        if (isIgnoreParamsDiagnostic() === true) {
            return;
        }

        // Если isValid ложно, то значит, что расширение не смогло найти в базе этой секции данный параметр. Выводим ошибку.
        if (this.isPropertyValid === false) {              
            let range: Range = new Range(new Position(this.index, 0), new Position(this.index, this.rawData.length));
            addError(range, "Некорректный параметр.", this.propertyName);
        }

        // Если isValidConditions ложно, то значит, что было указано условие, хотя параметр того не поддерживает. Выводим ошибку.
        if (!this.isValidConditions()) {
            // TODO: Сделать отправку ошибки кондишена
            // let range = lineData.data.get("conditions").range;
            // let text = "Параметр не может содержать условия.";
            // addError(range, text, lineData.propertyName);
        }
        // Если isValidFunctions ложно, то значит, что было указаны функции, хотя параметр того не поддерживает. Выводим ошибку.
        if (!this.isValidFunctions()) {
            // TODO: Сделать отправку ошибки функций
            // let range = lineData.data.get("functions").range;
            // let text = "Параметр не может содержать функции.";
            // addError(range, text, lineData.propertyName);
        }

        if (this.IsValidParamSyntax()) {
            // Если isHaveResult ложно, то значит, что у строки нету значения. Выводим ошибку.
            // if (!this.IsHasResult()) {
            //     addError(this.propertyRange, "Параметр не может быть пустым.", this.propertyName);
            // }
        }
        else {
            addError(new Range(new Position(this.index, 0), new Position(this.index, this.rawData.length)), "Некорректная запись.")
        }
    }
}