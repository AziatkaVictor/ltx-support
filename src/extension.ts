import * as path from 'path';
import { workspace, ExtensionContext, languages, CompletionItem, Range, CompletionItemKind, window, commands, extensions, Hover, MarkdownString, SignatureHelpProvider, TextDocument, Position, CancellationToken, SignatureHelpContext, ProviderResult, SignatureHelp, SignatureInformation, ParameterInformation, SemanticTokensLegend, DocumentSemanticTokensProvider, SemanticTokens, SemanticTokensBuilder, CompletionItemProvider } from 'vscode';
import * as fs from 'fs';
import { parseString } from 'xml2js';

let JSONdata = [];

export function activate(context: ExtensionContext) {
    languages.registerCompletionItemProvider("ltx", addLogicFunctions(), '=');
    languages.registerCompletionItemProvider("ltx", getLocalization());
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

function getLocalization(): CompletionItemProvider<CompletionItem> {
    return {
        provideCompletionItems() {
            let settingsPath: string = workspace.getConfiguration("", window.activeTextEditor.document.uri).get("PathToLocalization");
            let dir;

            if (settingsPath) {
                dir = settingsPath.replace("\\", "/");
            }
            else {
                dir = path.resolve(__dirname, '../data/localization/');
            }

            let item = (file, name, text) => {
                file = file.replace(".xml", "")
                let data: CompletionItem = {
                    label: name,
                    kind: CompletionItemKind.Variable,
                    detail: file + "." + name,
                }
                let temp = new MarkdownString(text);
                temp.isTrusted = true;
                temp.supportHtml = true;
                data.documentation = temp;
                return data;
            }           

            let arr = [];

            let files = fs.readdirSync(dir);
            files.forEach(file => {
                
                (parseXML(path.resolve(dir, file)).string_table.string).forEach(file_item => {
                    let temp = item(file, file_item.$.id, file_item.text[0]);
                    
                    arr.push(temp);
                });
            });
            return arr;
        }
    }
}

function parseXML(file: string) {
    const Iconv = require('iconv').Iconv;
    const iconv = new Iconv('cp1251', 'UTF-8');

    let value = fs.readFileSync(file);
    
    value = iconv.convert(value);
    let text = String(value).replace("\"#$&'()*+-./:;<=>?@[]^_`{|}~", "");
    let data;

    parseString(text, function (err, result) {
        if (err) {
            console.log(file);
            console.log('There was an error when parsing: ' + err);
        }
        else {
            data = result;
        }
    });
    return data;
}
