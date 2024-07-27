import { TextDocument } from "vscode";
import { Document } from "./Common";

export class TasksDocument extends Document {

    public static canBeCreated(document: TextDocument): boolean {
        const path = document.uri.path;
        return path.search(/tm\_.+.ltx/) !== -1 || path.includes("task_manager.ltx");
    }
}