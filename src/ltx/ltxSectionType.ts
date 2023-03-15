import { getModules, getParams } from "../utils/modulesParser";

export class LtxSectionType {
    readonly name: string
    readonly isValid: boolean

    getParams() {
        return getParams(this.name);
    }

    constructor(name: string) {
        this.name = name;
        if (getModules().map((value) => {return value.split(":")[0]}).includes(this.name)) {
            this.isValid = true;
        }
        else {
            this.isValid = false;
        }
    }
}