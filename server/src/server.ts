import {
    createConnection,
    TextDocuments,
    Diagnostic,
    DiagnosticSeverity,
    ProposedFeatures,
    InitializeParams,
    DidChangeConfigurationNotification,
    CompletionItem,
    CompletionItemKind,
    TextDocumentPositionParams,
    TextDocumentSyncKind,
    InitializeResult,
    HoverParams,
    Hover,
    SemanticTokensLegend
} from 'vscode-languageserver/node';
import {
    TextDocument
} from 'vscode-languageserver-textdocument';

let connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize((params: InitializeParams) => {
    return {
        capabilities: {
            hoverProvider: true,
            referencesProvider: true
        },
    };
});

connection.onInitialized(() => {
    connection.window.showInformationMessage('LTX Server is started!');
});

connection.onHover((params: HoverParams): Promise<Hover> => {
    return Promise.resolve({
        contents: ["Hover Demo"],
    });
});

documents.listen(connection);
connection.listen();