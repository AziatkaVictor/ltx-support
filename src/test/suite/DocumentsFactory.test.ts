import * as assert from 'assert';
import { DocumentsFactory, DocumentsManager, LogicDocument } from '../../classes/ltx';
import { Uri, workspace, window } from "vscode";
import { TextEncoder } from 'util';
import { before } from 'mocha';

suite("Documents Factory", () => {
    suite('Logic', () => {
        const path = Uri.parse("/test/logic.ltx");
        before(async () => {
            const content = '[logic@main]\nactive = nil';
            await workspace.fs.writeFile(path, new TextEncoder().encode(content));
            var editor = await window.showTextDocument(path);
            await editor.document.save();
        })

        test("File 'logic.ltx' exists", async () => {
            const manager = DocumentsManager.instance;
            const document = (await window.showTextDocument(path)).document;
            assert.equal(manager.has(document.uri), true);
        });

        test("Type of 'logic.ltx' is logic", async () => {
            const document = (await window.showTextDocument(path)).document;
            const createdDocument = DocumentsFactory.instance.create(document);
            assert.equal(createdDocument instanceof LogicDocument, true);
        });
    });
});