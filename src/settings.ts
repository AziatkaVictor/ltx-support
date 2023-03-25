import { workspace } from "vscode";

const settings = workspace.getConfiguration("", workspace.workspaceFile);

export function getPathToScripts() : string | null {
    return settings.get("ltx-support.directories.pathToScripts");
}

export function getPathToMisc() : string | null {
    return settings.get("ltx-support.directories.pathToMisc");
}

export function getPathToLocalization() : string | null {
    return settings.get("ltx-support.directories.pathToLocalization");
}

export function getIgnoredLocalization() : string[] {
    return settings.get("ltx-support.completion.ignoreLocalizationFile");
}

export function isIgnoreQuests() : boolean {
    return settings.get("ltx-support.completion.ignoreQuest");
}

export function isIgnoreDialogs() : boolean {
    return settings.get("ltx-support.completion.ignoreDialogs");
}

export function getUserDocumentation(filename : string) : Object {
    return settings.get("ltx-support.documentation." + filename + "Documentation");
}

export function GetUpdateDocumentation() : boolean {
    return settings.get("ltx-support.documentation.updateDocumentation");
}

export function getUserArgsDocumentation() : string[] {
    return settings.get("ltx-support.documentation.argsTypeForFunctionsDocumentation");
}

export async function setUserDocumentation(filename : string, value) {
    await settings.update("ltx-support.documentation." + filename + "Documentation", value);
}

export function isIgnoreParamsDiagnostic() : boolean {
    return settings.get("ltx-support.diagnostics.ignoreParamsDiagnostic");
}

export function isDiagnosticEnabled() : boolean {
    return false; //settings.get("Diagnostics.EnableDiagnostic");
}

export function isUseWorkspaceFolder() : boolean {
    return settings.get("ltx-support.game.useWorkspaceFolder");
}

export function getAdditiveCommands() : string | null {
    return settings.get("ltx-support.game.additiveCommands");
}

export function getGamePath() : string | null {
    return settings.get("ltx-support.game.path");
}

export function getGameCommands() : [] {
    return settings.get("ltx-support.game.commands");
}

export function getDefaultPathToConditions() : string {
    return "../../data/scripts/xr_conditions.script";
}

export function getDefaultPathToFunctions() : string {
    return "../../data/scripts/xr_effects.script";
}

export function getDefaultPathToModules() : string {
    return "../../data/scripts/modules.script";
}

export function getDefaultPathToScripts() : string {
    return "../../data/scripts/";
}

export function getDefaultPathToLocalization() : string {
    return "../../data/localization/";
}

export function getDefaultPathToGit() : string {
    return "https://raw.githubusercontent.com/AziatkaVictor/ltx-support/master/data/documentation/";
}