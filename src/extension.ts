import * as path from 'path';
import { workspace, ExtensionContext, languages, CompletionItem, Range, CompletionItemKind, window, commands, extensions, Definition, MarkdownString, SignatureHelpProvider, TextDocument, Position, CancellationToken, SignatureHelpContext, ProviderResult, SignatureHelp, SignatureInformation, ParameterInformation, SemanticTokensLegend, DocumentSemanticTokensProvider, SemanticTokens, SemanticTokensBuilder, CompletionItemProvider, TreeItemCollapsibleState, DefinitionProvider, Location } from 'vscode';
import * as fs from 'fs';
import { parseString } from 'xml2js';

const tokenTypes = ['class', 'interface', 'enum', 'function', 'variable'];
const tokenModifiers = ['declaration', 'definition', 'documentation'];
const legend = new SemanticTokensLegend(tokenTypes, tokenModifiers);

interface parseLtxData {
    type: string,
    modificator?: string[] | null,
    data?: semanticData[]
}

interface semanticData {
    range: Range,
    text?: string
}

interface Data {
    logicSections?: semanticData[],
    logicSectionsLink?: semanticData[],
    functions?: parseLtxData[],
    localization?: parseLtxData[],
}

let GlobalData: Data = {
    logicSections: [],
    logicSectionsLink: [],
    functions: [],
    localization: []
};

export function activate(context: ExtensionContext) {
    languages.registerCompletionItemProvider("ltx", addLogicFunctions(), '=');
    languages.registerCompletionItemProvider("ltx", getLocalization());
    languages.registerDocumentSemanticTokensProvider("ltx", getSemanticLtx(), legend);
    languages.registerDefinitionProvider("ltx", addLogicDefinition());
    window.showInformationMessage('LTX Support is started!');
}

function getSemanticLtx() {
    const provider: DocumentSemanticTokensProvider = {
        provideDocumentSemanticTokens(
            document: TextDocument
        ): ProviderResult<SemanticTokens> {
            const tokensBuilder = new SemanticTokensBuilder(legend);

            const data = parseLtx(document);

            data.forEach(Type => {
                Type.data.forEach(item => {
                    tokensBuilder.push(item.range, Type.type, Type.modificator);
                });
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
            if (isSelectionInsideGroup()) {
                return arr;
            }
            else {
                return null;
            }
        }
    }
};

function addLogicDefinition(): DefinitionProvider {
    return {
        provideDefinition(doc, pos, token): ProviderResult<Definition> {
            for (let index = 0; index < GlobalData.logicSectionsLink.length; index++) {
                const item = GlobalData.logicSectionsLink[index];
                if (isInRange(item.range, pos)) {
                    console.log(item);
                    console.log(pos);
                    let definitionItem = getlogicSectionsByText(item.text);
                    console.log(definitionItem);
                    let data: Definition = new Location(doc.uri, definitionItem.range);
                    console.log(data);
                    return data;
                }
            }
            return;
        }
    }
}

function getlogicSectionsByText(data: string) : semanticData {
    for (let index = 0; index < GlobalData.logicSections.length; index++) {
        const element = GlobalData.logicSections[index];
        if (element.text === data) {
            return element;
        }
    }
}

function parseLtx(document: TextDocument) {
    let array: parseLtxData[] = [];
    let Sections: parseLtxData = {
        type: "interface", modificator: ["definition"]
    };
    let SectionsLinks: parseLtxData = {
        type: "interface", modificator: ["declaration"]
    };
    GlobalData.logicSections = [];
    GlobalData.logicSectionsLink = [];

    for (let line = 0; line < document.lineCount; line++) {
        const data = document.lineAt(line).text;

        let re: RegExp = /\[/;
        let matchStart = re.exec(data);
        re = /\]/;
        let matchEnd = re.exec(data);
        if (matchStart && matchEnd) {
            let [start, end] = [matchStart.index, matchEnd.index];
            const rangeItem = new Range(new Position(line, start + 1), new Position(line, end));
            const textItem = document.getText(rangeItem);

            let item: semanticData = {
                range: rangeItem,
                text: textItem
            }

            GlobalData.logicSections.push(item)

            if (!Sections.data) {
                Sections.data = [];
            }
            Sections.data.push(item);
        };
    }

    for (let line = 0; line < document.lineCount; line++) {
        const data = document.lineAt(line).text;

        GlobalData.logicSections.forEach(element => {
            let sectionName = element.text;
            let re;
            if (sectionName.search("@") === -1) {
                re = new RegExp('[^\\[]' + sectionName + '(?!@)', 'g');
            }
            else {
                re = new RegExp('[^\\[]' + sectionName, 'g')
            }
            let text = data.replace(/\;.*/, "");
            let match = re.exec(text);
            if (match && match['indices'][0]) {
                console.log(match);
                let [start, end] = match['indices'][0];
                let item: semanticData = {
                    range: new Range(new Position(line, start), new Position(line, end)),
                    text: match[0].trim()
                }
                if (!SectionsLinks.data) {
                    SectionsLinks.data = [];
                }
                GlobalData.logicSectionsLink.push(item);
                SectionsLinks.data.push(item);
            }
        });
    }

    array.push(Sections);
    array.push(SectionsLinks);
    return array;
}

function isSelectionInsideGroup(): boolean {
    const sel = window.activeTextEditor.selection;
    const Line = window.activeTextEditor.document.lineAt(sel.start.line);
    let isInCondGroup = false, isInFuncGroup = false;

    let re: RegExp = /\%.*?\%/g;
    let match = re.exec(Line.text);
    if (match) {
        const [checkRangeFunc_start, checkRangeFunc_end] = match['indices'][0];
        isInFuncGroup = (checkRangeFunc_start < Line.range.start < checkRangeFunc_end);
    }

    re = /\{.*?\}/g;
    match = re.exec(Line.text);
    if (match) {
        const [checkRangeCond_start, checkRangeCond_end] = match['indices'][0];
        isInCondGroup = (checkRangeCond_start < Line.range.start < checkRangeCond_end);

    }

    return isInFuncGroup || isInCondGroup;
};

function isInRange(range: Range, position: Position): boolean {
    if ((range.start.line <= position.line) && (position.line <= range.end.line)) {
        return (range.start.character < position.character) && (position.character < range.end.character);
    }
    return false;
}

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
            if (files !== null && files !== []) {
                let ignoredFiles: string[] = workspace.getConfiguration("", window.activeTextEditor.document.uri).get("IgnoreLocalizationFile");
                files = files.filter(function (el) {
                    return ignoredFiles.indexOf(el) < 0;
                });

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
