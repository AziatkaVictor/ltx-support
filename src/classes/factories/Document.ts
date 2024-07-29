import { TextDocument } from "vscode";
import { AbstractFactory } from "./Abstract"
import { Document } from "../documents/Index";

interface IDocumentFactoryObject <T extends Document> {
    condition: Function;
    classToCreate: { new(...args): T; };
}

export class DocumentsFactory implements AbstractFactory {
    private static _instance: DocumentsFactory;
    private registeredClasses: Map<string, IDocumentFactoryObject<Document>>;

    private constructor() {
        this.registeredClasses = new Map();
    }

    public static get instance(): DocumentsFactory {
        return this._instance || (this._instance = new this());
    }

    /** 
     * Register new document class for factory with given ID
     * @param id Name for register class
     * @param classToRegister
     * @returns Is action successful
    */
    public register(id: string, classToRegister: IDocumentFactoryObject<Document>): boolean {
        if (!this.registeredClasses.has(id)) {
            this.registeredClasses.set(id, classToRegister);
            return true;
        }
        return false;
    }

    /**
     * Unregister document with given ID, if it's exist 
     * @param id Which class to unregister
     * @returns Is action successful
     */
    public unregister(id: string): boolean {
        if (this.registeredClasses.has(id)) {
            this.registeredClasses.delete(id);
            return true;
        }
        return false;
    }

    /**
     * Create {@link Document} extended object from registered classes by given conditions
     * @param document File which must be analyzed
     * @returns Created document
     */
    public create(document: TextDocument): Document {
        if (!document) {
            console.error("Document factory failed to create object, because TextDocument is null!")
        }

        // Check all registered classes, that they can be used for this document
        // it's important to have the list of them for debugging
        var classes: IDocumentFactoryObject<Document>[] = [];
        for (const documentClass of this.registeredClasses.values()) {
            if (documentClass.condition(document)) {
                classes.push(documentClass);
            }
        }

        // If class is not found, than just use default Document class
        if (classes.length < 1)
        {
            return new Document(document);
        }

        // Warn developer, when we have more 1 classes. It's mean, that conditions of classes are bad
        if (classes.length > 1) {
            console.warn("Document factory has more than one class to create! Picking first one...");
        }

        return new classes[0].classToCreate(document);
    }
}