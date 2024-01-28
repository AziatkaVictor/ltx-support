import { TextDocument } from "vscode";
import { AbstractFactory } from "./Abstract"
import { Document, LogicDocument, SquadsDocument, TasksDocument, SoundsDocument, TradeDocument } from "../documents/Index";

export class DocumentFactory implements AbstractFactory {
    static create(document: TextDocument): Document {
        const path = document.uri.path;
        const text = document.getText();

        if (path.includes("configs\\scripts\\") || text.match(new RegExp(/\[logic(@.+)?\]/))) {
            console.debug(`Creating logic document for ${document.fileName}`)
            return new LogicDocument(document);
        }
        else if (path.match(/tm\_.+.ltx/) || path.includes("task_manager.ltx")) {
            console.debug(`Creating quests document for ${document.fileName}`)
            return new TasksDocument(document);
        }
        else if (path.match(/squad_descr(\_.+)?.ltx/)) {
            console.debug(`Creating squads document for ${document.fileName}`)
            return new SquadsDocument(document);
        }
        else if (path.match(/script_sound(\_.+)?.ltx/)) {
            console.debug(`Creating sounds document for ${document.fileName}`)
            return new SoundsDocument(document);
        }
        else if (path.includes("misc\\trade")) {
            console.debug(`Creating trade document for ${document.fileName}`)
            return new TradeDocument(document);
        }

        return new Document(document);
    }
}