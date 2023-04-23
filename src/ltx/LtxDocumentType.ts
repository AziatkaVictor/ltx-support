export enum LtxDocumentType {
    Logic,
    Squad,
    Tasks,
    Sound,
    Trade,
    Unknown
}

export const LtxDocumentTypeParams: { [key in LtxDocumentType]?: string } = {
    [LtxDocumentType.Logic]: "xr_logic.script",
    [LtxDocumentType.Squad]: "sim_squad_scripted.script",
    [LtxDocumentType.Tasks]: "task_objects.script",
    [LtxDocumentType.Sound]: "sound_theme.script",
    [LtxDocumentType.Trade]: "trade_manager.script",
}