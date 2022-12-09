import { PARAMS_DATA } from "../data"

export class LtxSectionProperty {
    readonly name: string
    readonly dataType: "condlist" | "boolean" | "number" | "string" | "string_and_condlist" | "number_and_condlist"
    readonly isCanHaveConditions: boolean = true
    readonly isCanHaveFunctions: boolean = true
    readonly isCanHaveLink: boolean = true
    readonly isCanHaveCallback: boolean = false
    readonly isOptional: boolean = true

    constructor(name: string, isOptional?: boolean) {
        if (!PARAMS_DATA[name]) {
            return null;
        }
        this.dataType = PARAMS_DATA[name].type;

        switch (this.dataType) {
            case "boolean":
                this.isCanHaveFunctions = false;
                this.isCanHaveLink = false;
                this.isCanHaveCallback = false;
                break;

            case "number":
                this.isCanHaveFunctions = false;
                this.isCanHaveLink = false;
                this.isCanHaveCallback = false;
                break;

            case "string":
                this.isCanHaveFunctions = false;
                this.isCanHaveLink = false;
                this.isCanHaveCallback = false;
                break;

            case "string_and_condlist":
                this.isCanHaveCallback = true;
                break;

            case "number_and_condlist":
                this.isCanHaveCallback = true;
                break;

            default:
                this.dataType = "condlist";
                break;
        }

        if (isOptional === false) {
            this.isOptional = isOptional;
        }
    }
}
