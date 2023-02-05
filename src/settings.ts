import { workspace } from "vscode";

export function getPathToScripts() : string | null {
    return workspace.getConfiguration("", workspace.workspaceFile).get("ltx-support.directories.pathToScripts");
}

export function getPathToMisc() : string | null {
    return workspace.getConfiguration("", workspace.workspaceFile).get("ltx-support.directories.pathToMisc");
}

export function getUserDocumentation(filename : string) : Object {
    return workspace.getConfiguration("", workspace.workspaceFile).get("ltx-support.documentation." + filename + "Documentation");
}

export function getUserArgsDocumentation() : string[] {
    return workspace.getConfiguration("", workspace.workspaceFile).get("ltx-support.documentation.argsTypeForFunctionsDocumentation");
}

export async function setUserDocumentation(filename : string, value) {
    await workspace.getConfiguration("", workspace.workspaceFile).update("ltx-support.documentation." + filename + "Documentation", value);
}

export function isIgnoreParamsDiagnostic() : boolean {
    return workspace.getConfiguration("", workspace.workspaceFile).get("ltx-support.diagnostics.ignoreParamsDiagnostic");
}

export function isDiagnosticEnabled() : boolean {
    return false; //workspace.getConfiguration("", workspace.workspaceFile).get("Diagnostics.EnableDiagnostic");
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