import { workspace } from "vscode";

function getSettings() {
    return workspace.getConfiguration("", workspace.workspaceFile);
}

export function getPathToScripts() : string | null {
    return getSettings().get("ltx-support.directories.pathToScripts");
}

export function getPathToMisc() : string | null {
    return getSettings().get("ltx-support.directories.pathToMisc");
}

export function getPathToLocalization() : string | null {
    return getSettings().get("ltx-support.directories.pathToLocalization");
}

export function getIgnoredLocalization() : string[] {
    return getSettings().get("ltx-support.completion.ignoreLocalizationFile");
}

export function isIgnoreQuests() : boolean {
    return getSettings().get("ltx-support.completion.ignoreQuest");
}

export function isIgnoreDialogs() : boolean {
    return getSettings().get("ltx-support.completion.ignoreDialogs");
}

export function getUserDocumentation(filename : string) : Object {
    return getSettings().get("ltx-support.documentation." + filename + "Documentation");
}

export function isUpdateDocumentation() : boolean {
    return getSettings().get("ltx-support.documentation.updateDocumentation");
}

export function getUserArgsDocumentation() : string[] {
    return getSettings().get("ltx-support.documentation.argsTypeForFunctionsDocumentation");
}

export async function setUserDocumentation(filename : string, value) {
    await getSettings().update("ltx-support.documentation." + filename + "Documentation", value);
}

export function isIgnoreParamsDiagnostic() : boolean {
    return getSettings().get("ltx-support.diagnostics.ignoreParamsDiagnostic");
}

export function isDiagnosticEnabled() : boolean {
    return getSettings().get("ltx-support.diagnostics.enable");
}

export function isUseWorkspaceFolder() : boolean {
    return getSettings().get("ltx-support.game.useWorkspaceFolder");
}

export function isSilentStart() : boolean {
    return getSettings().get("ltx-support.game.silentStart");
}

export function getAdditiveCommands() : string | null {
    return getSettings().get("ltx-support.game.additiveCommands");
}

export function getGamePath() : string | null {
    return getSettings().get("ltx-support.game.path");
}

export function getGameCommands() : [] {
    return getSettings().get("ltx-support.game.commands");
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