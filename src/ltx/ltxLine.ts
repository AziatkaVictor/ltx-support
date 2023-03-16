import { Position, Range } from "vscode"
import { getBasedConditions, getSectionData } from "../utils/modulesParser"
import { LtxCondlist } from "./ltxCondlist"
import { LtxSection } from "./ltxSection"
import { addSemantic, LtxSemantic, LtxSemanticDescription, LtxSemanticModification, LtxSemanticType } from "./ltxSemantic"

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

    isInsideSignal(position : Position): boolean {
        for (const signal of this.signals.keys()) {
            if (signal.start.isBefore(position) && signal.end.isAfterOrEqual(position)) {
                return true;
            }
        }
        return false;
    }

    getType(): string | null {
        for (const param of getSectionData().get(this.owner.getTypeName())) {
            if (param.indexOf(this.propertyName) !== -1) {
                return param.split(":")[0];
            }
        }

        for (const condition of getBasedConditions()) {
            if (condition.indexOf(this.propertyName) !== -1) {
                return condition.split(":")[0];
            }
        }
    }

    constructor(index: number, data: string, owner: LtxSection) {
        this.index = index;
        this.rawData = data;
        this.owner = owner;

        let re = /^(\s*?)?[\w\$]+?(?=(\s*?)?\=)/gm;
        var param = re.exec(data);

        if (!param) {
            this.isPropertyValid = false;
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
                    addSemantic(new LtxSemantic(LtxSemanticType.keyword, null, tempRange, LtxSemanticDescription.signal, match[0]))
                }
                else if (!isNaN(+(match[0].trim()))) {
                    addSemantic(new LtxSemantic(LtxSemanticType.number, null, tempRange, LtxSemanticDescription.signal, match[0]))
                }
                else {
                    addSemantic(new LtxSemantic(LtxSemanticType.constant, null, tempRange, LtxSemanticDescription.signal, match[0]))
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
            this.condlists.push(new LtxCondlist(index, match.index, match[0]));
        }
    }
}