import { workspace } from "vscode";

export function getPathToScripts() : string | null {
    return workspace.getConfiguration("", workspace.workspaceFile).get("ltx-support.Directories.pathToScripts");
}

export function getPathToMisc() : string | null {
    return workspace.getConfiguration("", workspace.workspaceFile).get("ltx-support.directories.pathToMisc");
}

export function isIgnoreParamsDiagnostic() : boolean {
    return workspace.getConfiguration("", workspace.workspaceFile).get("ltx-support.diagnostics.ignoreParamsDiagnostic");
}

export function isDiagnosticEnabled() : boolean {
    return false; //workspace.getConfiguration("", workspace.workspaceFile).get("Diagnostics.EnableDiagnostic");
}