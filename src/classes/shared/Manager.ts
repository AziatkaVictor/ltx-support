import { TextDocument, Uri } from "vscode";
import { Document } from "../documents/Index"
import { DocumentsFactory } from "../factories/Document";

export class DocumentsManager {
    private static _instance: DocumentsManager;
    private data: Map<Uri, Document>

    private constructor() {
        this.data = new Map<Uri, Document>();
    }

    public static get instance()
    {
        return this._instance || (this._instance = new this());
    }

    /**
     * 
     * @param document 
     * @returns 
     */
    public get(document: TextDocument): Document {
        if (!this.data.has(document.uri)) {
            this.set(document, DocumentsFactory.instance.create(document));
        }
        return this.data.get(document.uri);
    }

    /**
     * 
     * @param document 
     * @param value 
     */
    public set(document: TextDocument, value?: Document): void {
        if (!value) {
            value = DocumentsFactory.instance.create(document);
        }
        this.data.set(document.uri, value);
    }

    public has(uri: Uri): boolean {
        return this.data.has(uri);
    }
}