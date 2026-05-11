import { workspace } from "vscode";
import * as path from "path";

function getSettings() {
    return workspace.getConfiguration("", workspace.workspaceFile);
}

let _extensionPath: string = "";

/**
 * Должно вызываться один раз в `activate()`, чтобы сохранить путь к корню расширения.
 * Используется для построения абсолютных путей к встроенным ресурсам (`data/...`).
 */
export function setExtensionRoot(extensionPath: string) {
    _extensionPath = extensionPath;
}

function dataPath(...segments: string[]): string {
    return path.join(_extensionPath, "data", ...segments);
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

export function isDiagnosticEnabled() : boolean {
    return getSettings().get("ltx-support.diagnostics.enable");
}

export function isHideInformation() : boolean {
    return getSettings().get("ltx-support.diagnostics.hideInformation");
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
    return dataPath("scripts", "xr_conditions.script");
}

export function getDefaultPathToFunctions() : string {
    return dataPath("scripts", "xr_effects.script");
}

export function getDefaultPathToModules() : string {
    return dataPath("scripts", "modules.script");
}

export function getDefaultPathToScripts() : string {
    return dataPath("scripts") + path.sep;
}

export function getDefaultPathToLocalization() : string {
    return dataPath("localization") + path.sep;
}

export function getDefaultPathToDocumentation() : string {
    return dataPath("documentation") + path.sep;
}

export function getDefaultPathToGit() : string {
    return "https://raw.githubusercontent.com/AziatkaVictor/ltx-support/master/data/documentation/";
}