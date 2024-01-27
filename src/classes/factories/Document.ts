import { TextDocument } from "vscode";
import { AbstractFactory } from "./Abstract"
import { Document } from "../documents/Common";
import { LogicDocument } from "../documents/Logic";

export class DocumentFactory implements AbstractFactory {
    static create(document: TextDocument): Document {
        const path = document.uri.path;
        const text = document.getText();

        if (path.includes("configs\\scripts\\") || text.match(new RegExp(/\[logic(@.+)?\]/))) {
            return new LogicDocument(document);
        }
        else if (path.match(/tm\_.+.ltx/) || path.includes("task_manager.ltx")) {
            return new Document(document);
        }
        else if (path.match(/squad_descr(\_.+)?.ltx/)) {
            return new Document(document);
        }
        else if (path.match(/script_sound(\_.+)?.ltx/)) {
            return new Document(document);
        }
        else if (path.includes("misc\\trade")) {
            return new Document(document);
        }
        else {
            return new Document(document);
        }
    }
}