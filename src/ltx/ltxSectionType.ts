import { CONDITIONS_DATA, SECTIONS_DATA } from "../data";
import { getParams } from "../lua/modulesParser";
import { LtxSectionProperty } from "./ltxSectionProperty";


export class LtxSectionType {
    readonly name: string
    readonly params: Map<string, LtxSectionProperty>
    readonly isValid: boolean

    getParams() {
        return getParams(this.name);
    }

    constructor(name: string) {
        this.name = name
        this.params = new Map<string, LtxSectionProperty>();

        if (!SECTIONS_DATA) {
            return;
        }

        if (SECTIONS_DATA[name]) {
            // Получаем название параметров нужной нам секции, из файла json
            let keys: string[] = Object.keys(SECTIONS_DATA[name]);
            keys = keys.concat(CONDITIONS_DATA);

            // Перебираем их
            keys.forEach(itemName => {
                let property: LtxSectionProperty | null = null;

                if (!CONDITIONS_DATA.includes(itemName)) {
                    let item = SECTIONS_DATA[name][itemName];
                    if (Object.keys(item).length !== 0) {
                        if (!item.isOptional) {
                            property = new LtxSectionProperty(itemName, item.isOptional)
                        }
                    }
                    else {
                        property = new LtxSectionProperty(itemName)
                    }
                }
                else {
                    property = new LtxSectionProperty(itemName)
                }

                if (property) {
                    this.params.set(itemName, property);
                }
            });
            this.isValid = true
        }
        else {
            this.isValid = false
        }
    }
}