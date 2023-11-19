import { Position, Range } from "vscode"
import { getBasedConditions, getSectionData } from "../utils/modulesParser"
import { LtxCondlist } from "./ltxCondlist"
import { LtxSection } from "./ltxSection"
import { addSemantic, LtxSemantic, LtxSemanticDescription, LtxSemanticModification, LtxSemanticType } from "./ltxSemantic"
import { LtxDocument } from "./ltxDocument"
import { LtxDocumentType } from "./ltxDocumentType"
import { InvalidParameterError } from "./Diagnostic/Errors/InvalidParameter"
import { InvalidLineError } from "./Diagnostic/Errors/InvalidLine"

export class LtxLine {
    readonly index: number
    readonly propertyName: string
    readonly propertyRange: Range
    readonly isPropertyValid: boolean
    readonly condlists: LtxCondlist[] = []
    readonly signals: Map<Range, string> = new Map<Range, string>()
    readonly owner: LtxSection
    readonly rawData: string    

    inInsideCondlist(position: Position): boolean {
        for (const condlist of this.condlists) {
            if (condlist.isInside(position)) {
                return true;
            }
        }
        return false;
    }

    isInsideSignal(position: Position): boolean {
        for (const signal of this.signals.keys()) {
            if (signal.start.isBefore(position) && signal.end.isAfterOrEqual(position)) {
                return true;
            }
        }
        return false;
    }

    isType(name: string): boolean {
        return this.getType() ? this.getType().includes(name) : false;
    }

    canHaveSectionLink(): boolean {
        return (this.isType("condlist") || this.isType("npc_and_zone")) && (this.getOwnedDocument().getType() === LtxDocumentType.Trade || this.getOwnedDocument().getType() === LtxDocumentType.Logic);
    }

    getType(): string | null {
        const data = getSectionData().get(this.owner.getTypeName());
        if (data) {
            for (const param of data) {
                if (param.indexOf(this.getPropertyName()) !== -1) {
                    return param.split(":")[0];
                }
            }
        }

        for (const condition of getBasedConditions()) {
            if (condition.indexOf(this.getPropertyName()) !== -1) {
                return condition.split(":")[0];
            }
        }
    }

    getCondlist(selection: Position): LtxCondlist {
        for (const condlist of this.condlists) {
            if (condlist.isInside(selection)) return condlist;
        }
    }

    constructor(index: number, data: string, owner: LtxSection) {
        this.index = index;
        this.rawData = data;
        this.owner = owner;

        let re = /^\s*[\w\$]+?(?=\s*\=)/gm;
        var param = re.exec(data);

        if (!param) {
            this.isPropertyValid = false;
            if (!this.owner) {
                return;
            }
            if (this.getOwnedDocument().getType() === LtxDocumentType.Logic) {
                let range = new Range(new Position(index, 0), new Position(index, data.length));
                let error = new InvalidLineError(range);
                this.getOwnedDocument().addError(error);
            }
            return;
        }

        // Указываем название и тип строки
        this.propertyName = param[0].trim();
        this.propertyRange = new Range(new Position(index, param.index), new Position(index, param.index + param[0].length))
        addSemantic(new LtxSemantic(LtxSemanticType.property, LtxSemanticModification.readonly, this.propertyRange, LtxSemanticDescription.signal, this.propertyName))
        var tempData = data + "\n";

        // Поиск всех сигналов
        if (this.rawData.indexOf("|") !== -1) {
            let search = /(?<=(\=|\|)).*?(?=\|)/g
            let match;
            while ((match = search.exec(this.rawData)) !== null) {
                let tempRange = new Range(new Position(index, match.index), new Position(index, match.index + match[0].length))

                if (match[0].trim().toLowerCase().indexOf("true") !== -1 || match[0].trim().toLowerCase().indexOf("false") !== -1) {
                    addSemantic(new LtxSemantic(LtxSemanticType.keyword, null, tempRange, LtxSemanticDescription.signal, match[0]));
                }
                else if (isNaN(match[0].trim())) {
                    addSemantic(new LtxSemantic(LtxSemanticType.variable, null, tempRange, LtxSemanticDescription.signal, match[0]));
                }
                else {
                    addSemantic(new LtxSemantic(LtxSemanticType.number, null, tempRange, LtxSemanticDescription.signal, match[0]));
                }
                this.signals.set(tempRange, match[0]);

                let tempReplace = " ".repeat(1 + match[0].length) + "=";
                tempData = tempData.replace("=" + match[0] + "|", tempReplace);
            }
        }

        // Поиск всех condlist
        re = /(?<=(\=|\,)).+?(?=(\,|\\n|$))/gm;
        let match;
        while ((match = re.exec(tempData)) !== null) {
            this.condlists.push(new LtxCondlist(index, match.index, match[0], this));
        }

        if (!this.owner) {
            return;
        }

        if (!this.getOwnedSection().isIgnoreParamValidation(this.getPropertyName()) && this.getOwnedDocument().getType() !== LtxDocumentType.Trade) {
            var paramsData = this.getOwnedSection().getParams().map(value => { return value.split(":")[1] });
            if (!paramsData.includes(this.getPropertyName()) && paramsData.length > 0) {
                let error = new InvalidParameterError(this.propertyRange, null, this.propertyName);
                this.getOwnedDocument().addError(error);
            }
        }
    }

    getPropertyName() {
        return this.propertyName.replace(/\d+\b/g, "");
    }

    getOwnedSection(): LtxSection {
        return this.owner;
    }

    getOwnedDocument(): LtxDocument {
        return this.getOwnedSection().getOwnedDocument();
    }
}