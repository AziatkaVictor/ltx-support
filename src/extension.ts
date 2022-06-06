import * as path from 'path';
import { workspace, ExtensionContext, languages, CompletionItem, Range, CompletionItemKind, window, commands, extensions, Hover, MarkdownString, SignatureHelpProvider, TextDocument, Position, CancellationToken, SignatureHelpContext, ProviderResult, SignatureHelp, SignatureInformation, ParameterInformation, SemanticTokensLegend, DocumentSemanticTokensProvider, SemanticTokens, SemanticTokensBuilder, CompletionItemProvider } from 'vscode';
import * as fs from 'fs';
import { parseString } from 'xml2js';

let JSONdata = [];

export function activate(context: ExtensionContext) {
    languages.registerCompletionItemProvider("ltx", addLogicFunctions(), '=');
    window.showInformationMessage('LTX Support is started!');
}

export function deactivate() {
    return;
}

function addLogicFunctions(): CompletionItemProvider<CompletionItem> {
    return {
        provideCompletionItems() {
            let arr = [];
            const data = require("../data/logic_documintation.json");

            let item = (text) => {
                let item: CompletionItem = {
                    label: text,
                    kind: CompletionItemKind.Function,
                    detail: "xr_effects." + text,
                }
                if (data[text]) {
                    let Mark = new MarkdownString(data[text]['documentation']);
                    Mark.isTrusted = true;
                    Mark.supportHtml = true;
                    item.documentation = Mark;
                    let args = "";
                    data[text]["values"].forEach(element => {
                        if (args === "") {
                            args = element;
                        }
                        else {
                            args = args + ":" + element;
                        }
                    });
                    item.label = text + "(" + args + ")";
                }
                return item;
            }
            let temp;
            let settingsPath: string = workspace.getConfiguration("", window.activeTextEditor.document.uri).get("PathToFunctionsLogic");

            if (settingsPath) {
                temp = getLogicFunctionsLua(settingsPath);
            }
            else {
                temp = getLogicFunctionsLua(path.resolve(__dirname, "../data/xr_effects.script"));
            }

            temp.forEach(element => {
                arr.push(item(element));
            });

            return arr;
        }
    }
};

function getLogicFunctionsLua(filePath: string) {
    if (filePath) {
        let file = fs.readFileSync(String(filePath), 'utf8');
        let arr = file.replace("--\\[(=*)\\[(.|\n)*?\\]\\1\\]", "").split("\n");
        let func_arr = [];
        arr.forEach(element => {
            element = element.replace(' ', '').replace(' ', '');
            let text = element.substring(element.lastIndexOf("function") + 8, element.lastIndexOf("("));
            if ((text !== null) && (text !== '') && (element.search("function") !== -1) && (element.search("abort") === -1) && (element.search("printf") === -1)) {
                func_arr.push(text.trim());
            }
        });
        return func_arr;
    }
    else {
        window.showErrorMessage('Error! Path: ' + String(filePath));
    }
}

