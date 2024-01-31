import { TextDocument, Uri } from "vscode";
import { Document } from "../documents/Index"
import { DocumentFactory } from "../factories/Document";

export class DocumentsManager {
    private data: Map<Uri, Document>

    constructor() {
        this.data = new Map<Uri, Document>();
    }

    get(document: TextDocument): Document {
        if (!this.data.has(document.uri)) {
            this.set(document, DocumentFactory.create(document));
        }
        return this.data.get(document.uri);
    }

    set(document: TextDocument, value?: Document): void {
        if (!value) {
            value = DocumentFactory.create(document);
        }
        this.data.set(document.uri, value);
    }

    update(document: TextDocument): void {
        this.set(document, DocumentFactory.create(document));
    }
}