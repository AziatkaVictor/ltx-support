import { TextDocument } from "vscode";
import { Document } from "./Common";

export class LogicDocument extends Document {

    public static canBeCreated(document: TextDocument): boolean {
        const path = document.uri.path;
        const text = document.getText();

        return path.includes("configs\\scripts\\") || text.search(new RegExp(/\[logic(@.+)?\]/)) !== -1;
    }
}