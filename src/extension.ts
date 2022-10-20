import { workspace, ExtensionContext, languages, CompletionItem, CompletionItemKind, window, MarkdownString, TextDocument, ProviderResult, SemanticTokensLegend, DocumentSemanticTokensProvider, SemanticTokens, SemanticTokensBuilder, CompletionItemProvider, Uri, DiagnosticCollection, Diagnostic, ConfigurationChangeEvent } from 'vscode';
import * as fs from 'fs';
import { parseString } from 'xml2js';
import { getErrorsByFile, getSemanticsByFile, LtxDocument } from "./parseLtx";
import { getConditions, getFunctions, isInsideConditionsGroup, isInsideFunctionsGroup, updateScripts } from './parseLua';
import { isDiagnosticEnabled } from './utils';

const tokenTypes = ['property', 'struct', 'class', 'number', 'keyword', 'function', 'variable', 'string'];
const tokenModifiers = ['declaration', 'definition', 'documentation', 'readonly'];
const legend = new SemanticTokensLegend(tokenTypes, tokenModifiers);

let diagnosticCollection: DiagnosticCollection;
let fileData: LtxDocument;

export function activate(context: ExtensionContext) {
    diagnosticCollection = languages.createDiagnosticCollection("ltx");

    workspace.onDidChangeTextDocument(onChange);
    workspace.onDidOpenTextDocument(createFileData);
    window.onDidChangeActiveTextEditor(createFileData);

    workspace.onDidChangeConfiguration(updateData);

    context.subscriptions.push(languages.registerCompletionItemProvider("ltx", addLogicFunctions(), '='));
    context.subscriptions.push(languages.registerCompletionItemProvider("ltx", addLogicConditions(), '=', '!'));
    // languages.registerCompletionItemProvider("ltx", addCommonCompletion());
    context.subscriptions.push(languages.registerDocumentSemanticTokensProvider("ltx", getSemanticLtx(), legend));
    // languages.registerDefinitionProvider("ltx", addLogicDefinition());

    window.showInformationMessage('LTX Support is started!');
}

function updateData(event: ConfigurationChangeEvent) {
    if (event.affectsConfiguration("Directories.PathToScripts")) {
        updateScripts();
    }
    return;
}

function onChange(change) {    
    if (change.contentChanges.length !== 0) {
        createFileData();
    }
}

function createFileData() { 
    if (!window.activeTextEditor) {
        return;
    } 
    if (!window.activeTextEditor.document) {
        return;
    }

    try {   
        fileData = new LtxDocument(window.activeTextEditor.document);
    }
    catch (error) {
        console.log(error);  
        return;      
    }

    diagnosticCollection.clear();

    if (isDiagnosticEnabled()) {
        let diagnosticMap: Map<string, Diagnostic[]> = new Map();
        workspace.textDocuments.forEach(document => {
            if (document.languageId === "ltx") {
                let errors;

                if (fileData) {
                    errors = getErrorsByFile(fileData.path);
                }

                let canonicalFile = document.uri.toString();
                let diagnostics = diagnosticMap.get(canonicalFile);

                if (!diagnostics) {
                    diagnostics = [];
                }

                errors.forEach(item => {
                    diagnostics.push(new Diagnostic(item.range, item.descr));
                });

                diagnosticMap.set(canonicalFile, diagnostics);
            }
        })

        diagnosticMap.forEach((diags, file) => {
            diagnosticCollection.set(Uri.parse(file), diags);
        });
    }

}

function getSemanticLtx() {
    const provider: DocumentSemanticTokensProvider = {
        provideDocumentSemanticTokens(document: TextDocument): ProviderResult<SemanticTokens> {
            const tokensBuilder = new SemanticTokensBuilder(legend);

            if (!fileData) {
                createFileData();
            }

            let temp = getSemanticsByFile(document.uri.fsPath)
            temp.forEach(item => {
                let modification = [];
                if (item.modification) {
                    modification.push(item.modification);
                }

                tokensBuilder.push(item.range, item.type, modification);
            });

            return tokensBuilder.build();
        }
    };
    return provider;
}

export function deactivate() {
    return;
}

function addLogicFunctions(): CompletionItemProvider<CompletionItem> {
    return {
        provideCompletionItems() {
            if (!fileData) {
                createFileData();
            }

            const data = require("../data/logic_documintation.json");
            let temp;
            let items = [];
            
            if (isInsideFunctionsGroup(fileData)) {                
                temp = getFunctions();
                temp.forEach(LuaItem => {
                    let item = new CompletionItem(LuaItem, CompletionItemKind.Function)
                    item.detail = "xr_effects." + LuaItem;

                    if (data[LuaItem]) {
                        let Mark = new MarkdownString(data[LuaItem]['documentation']);
                        Mark.isTrusted = true;
                        Mark.supportHtml = true;
                        item.documentation = Mark;
                    }

                    items.push(item)
                });
                return items;
            }
            return null;
        }
    };
}

function addLogicConditions(): CompletionItemProvider<CompletionItem> {
    return {
        provideCompletionItems() {
            if (!fileData) {
                createFileData();
            }

            const data = require("../data/logic_documintation.json");
            let temp;
            let items = [];

            if (isInsideConditionsGroup(fileData)) {
                temp = getConditions();
                temp.forEach(LuaItem => {
                    let item = new CompletionItem(LuaItem, CompletionItemKind.Function)
                    item.detail = "xr_conditions." + LuaItem;
                    if (data[LuaItem]) {
                        let Mark = new MarkdownString(data[LuaItem]['documentation']);
                        Mark.isTrusted = true;
                        Mark.supportHtml = true;
                        item.documentation = Mark;
                    }
                    items.push(item)
                });
                return items;
            }
            return null;
        }
    };
}

// function addLogicDefinition(): DefinitionProvider {
//     return {
//         provideDefinition(doc, pos, token): ProviderResult<Definition> {
//             let data: Definition = null;
//             for (let index = 0; index < GlobalData.logicSectionsLink.length; index++) {
//                 const linkItem = GlobalData.logicSectionsLink[index];
//                 if (isInRange(linkItem.range, pos)) {
//                     let definitionItem = getGlobalDataItemByText(linkItem.text, GlobalData.logicSections);
//                     return data = new Location(doc.uri, definitionItem.range);
//                 }
//             }

//             for (let index = 0; index < GlobalData.functions.length; index++) {
//                 let funcItem = GlobalData.functions[index];
//                 if (isInRange(funcItem.range, pos)) {
//                     let path = getEffectsPath();
//                     if (path) {
//                         let file = fs.readFileSync(String(path), 'utf8');
//                         if (file) {
//                             let array = file.split("\n");
//                             let re = new RegExp('^function ' + funcItem.text + '(?=\\(.*?\\))', 'm');
//                             funcItem = null;

//                             for (let line = 0; line < array.length; line++) {
//                                 const element = array[line];
//                                 let text = re.exec(element);
//                                 if (text) {
//                                     let [start, end] = [text.index + 9, text.index + text[0].length - 9];
//                                     return data = new Location(Uri.file(getEffectsPath()), new Range(new Position(line, start), new Position(line, end)));
//                                 }
//                             }
//                         }
//                     }
//                 }
//             }
//         }
//     }
// }

// function addCommonCompletion(): CompletionItemProvider<CompletionItem> {
//     return {
//         provideCompletionItems() {
//             let settingsPath: string = workspace.getConfiguration("", window.activeTextEditor.document.uri).get("PathToLocalization");
//             let dir;

//             if (settingsPath) {
//                 dir = settingsPath.replace("\\", "/");
//             }
//             else {
//                 dir = path.resolve(__dirname, '../data/localization/');
//             }

//             let item = (file, name, text, kind: CompletionItemKind) => {
//                 let data: CompletionItem = {
//                     label: name,
//                     kind: kind,
//                 }

//                 if (file) {
//                     file = file.replace(".xml", "")
//                     data.detail = file + "." + name;
//                 }
//                 else {
//                     data.detail = name;
//                 }

//                 if (text) {
//                     let temp = new MarkdownString(text);
//                     temp.isTrusted = true;
//                     temp.supportHtml = true;
//                     data.documentation = temp;
//                 }
//                 return data;
//             }

//             let arr = [];

//             let files = fs.readdirSync(dir);
//             if (files && files !== []) {
//                 let ignoredFiles: string[] = workspace.getConfiguration("", window.activeTextEditor.document.uri).get("IgnoreLocalizationFile");
//                 files = files.filter(function (el) {
//                     return ignoredFiles.indexOf(el) < 0;
//                 });

//                 files.forEach(file => {

//                     (parseXML(path.resolve(dir, file)).string_table.string).forEach(file_item => {
//                         let temp = item(file, file_item.$.id, file_item.text[0], CompletionItemKind.Variable);

//                         arr.push(temp);
//                     });
//                 });
//             }

//             let infoArray = [];
//             GlobalData.info.forEach(dataItem => {
//                 if (!infoArray.includes(dataItem.text)) {
//                     let temp = item(null, dataItem.text, null, CompletionItemKind.Unit);
//                     infoArray.push(dataItem.text);
//                     arr.push(temp);
//                 }
//             });

//             return arr;
//         }
//     }
// }

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
