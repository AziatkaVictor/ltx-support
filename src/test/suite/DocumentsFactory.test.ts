import * as assert from 'assert';
import { DocumentsFactory, DocumentsManager, LogicDocument } from '../../classes/ltx';
import { Uri, workspace, window, TextEditor } from "vscode";
import { TextEncoder } from 'util';

suite("Documents Factory", () => {
    suite('Logic', () => {
        const content = '[logic@main]\nactive = nil';
        const path = Uri.parse("./test/logic.ltx");
        workspace.fs.writeFile(path, new TextEncoder().encode(content));
        var editor = window.showTextDocument(path);

        test("File 'logic.ltx' exists", async () => {
            const manager = DocumentsManager.instance;
            assert.equal(manager.has((await editor).document.uri), true);
        });

        test("Type of 'logic.ltx' is logic", async () => {
            const document = DocumentsFactory.instance.create((await editor).document);
            assert.equal(document instanceof LogicDocument, true);
        });
    });
});