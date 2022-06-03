import * as path from 'path';
import { workspace, ExtensionContext, languages, CompletionItem, Range, CompletionItemKind, window, commands, extensions } from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';
import * as fs from 'fs';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
    let serverModule = context.asAbsolutePath(
        path.join('server', 'out', 'server.js')
    );

    let serverOptions: ServerOptions = {
        module: serverModule, transport: TransportKind.ipc
    };

    let clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'ltx' }],
    };

    client = new LanguageClient(
        'LtxLanguageServer',
        'LTX Language Server',
        serverOptions,
        clientOptions
    );

    client.start();
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}