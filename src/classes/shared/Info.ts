export enum InfoType {
    Add,
    Remove,
    IsExist,
    IsNotExist
}

export class Info {
    constructor(readonly name: string, readonly type: InfoType) {}
}