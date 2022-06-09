import * as path from 'path';
import { workspace, ExtensionContext, languages, CompletionItem, Range, CompletionItemKind, window, commands, extensions, Definition, MarkdownString, SignatureHelpProvider, TextDocument, Position, CancellationToken, SignatureHelpContext, ProviderResult, SignatureHelp, SignatureInformation, ParameterInformation, SemanticTokensLegend, DocumentSemanticTokensProvider, SemanticTokens, SemanticTokensBuilder, CompletionItemProvider, TreeItemCollapsibleState, DefinitionProvider, Location, Uri } from 'vscode';
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
    functions?: semanticData[],
    localization?: semanticData[],
    info?: semanticData[],
}

let GlobalData: Data = {
    logicSections: [],
    logicSectionsLink: [],
    functions: [],
    localization: [],
    info: []
};

export function activate(context: ExtensionContext) {
    languages.registerCompletionItemProvider("ltx", addLogicFunctions(), '=');
    languages.registerCompletionItemProvider("ltx", addCommonCompletion());
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

            if (getEffectsPath()) {
                temp = getLogicFunctionsLua(getEffectsPath());
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

function getEffectsPath(): string {
    return workspace.getConfiguration("", window.activeTextEditor.document.uri).get("PathToFunctionsLogic");
}

function addLogicDefinition(): DefinitionProvider {
    return {
        provideDefinition(doc, pos, token): ProviderResult<Definition> {
            let data: Definition = null;
            for (let index = 0; index < GlobalData.logicSectionsLink.length; index++) {
                const linkItem = GlobalData.logicSectionsLink[index];
                if (isInRange(linkItem.range, pos)) {
                    let definitionItem = getGlobalDataItemByText(linkItem.text, GlobalData.logicSections);
                    console.log(definitionItem);
                    
                    return data = new Location(doc.uri, definitionItem.range);
                }
            }
                    
            for (let index = 0; index < GlobalData.functions.length; index++) {
                let funcItem = GlobalData.functions[index];
                if (isInRange(funcItem.range, pos)) {
                    let path = getEffectsPath();
                    if (path) {
                        let file = fs.readFileSync(String(path), 'utf8');
                        if (file) {
                            let array = file.split("\n");
                            let re = new RegExp('^function ' + funcItem.text + '(?=\\(.*?\\))', 'm');
                            funcItem = null;
                            console.log(re);
                            
                            for (let line = 0; line < array.length; line++) {
                                const element = array[line];
                                let text = re.exec(element);
                                console.log(text);                                
                                if (text) {
                                    let [start, end] = [text.index + 9, text[0].length - 9];
                                    return data = new Location(Uri.file(getEffectsPath()), new Range(new Position(line, start), new Position(line, end)));
                                }                                
                            }
                        }
                    }
                }
            }
        }
    }
}

function getGlobalDataItemByText(data: string, array: semanticData[]): semanticData {
    for (let index = 0; index < array.length; index++) {
        const element = array[index];
        if (element.text === data) {
            return element;
        }
    }
}

function parseLtx(document: TextDocument) {
    let array: parseLtxData[] = [];
    let Sections: parseLtxData = {
        type: "class", modificator: ["definition"]
    };
    let SectionsLinks: parseLtxData = {
        type: "class", modificator: ["declaration"]
    };
    let Info: parseLtxData = {
        type: "variable", modificator: []
    };
    let Functions: parseLtxData = {
        type: "function", modificator: ["declaration"]
    };


    GlobalData.logicSections = [];
    GlobalData.logicSectionsLink = [];
    GlobalData.info = [];
    GlobalData.functions = [];

    for (let line = 0; line < document.lineCount; line++) {
        const data = document.lineAt(line).text.replace(/\;.*/, '');

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
        let data = document.lineAt(line).text.replace(/\;.*/, '');
        // TODO: Использовать RegExp для диагностики /(sr_idle@.*?|sr_idle)(?![a-zA-Z0-9_])/
        GlobalData.logicSections.forEach(element => {
            let sectionName = element.text;
            let re = new RegExp('([^\\w]|\\t)' + sectionName + '(?![a-zA-Z0-9_])(?!@)', 'g');

            let text = data.replace(/\;.*/, "");
            if (data !== '' && data !== null) {
                let match = re.exec(text);
                if (match) {
                    let start, end;
                    if (match['indices']) {
                        [start, end] = match['indices'][0];
                    }
                    else {
                        [start, end] = [match.index + 1, match.index + match[0].length];
                    }
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
            }
        });

        let re = new RegExp(/(\+|\-)\w*/g);
        let match;
        while ((match = re.exec(data)) !== null) {
            let [start, end] = [match.index + 1, match.index + match[0].length];
            let item: semanticData = {
                range: new Range(new Position(line, start), new Position(line, end)),
                text: match[0].trim().slice(1)
            }
            if (!Info.data) {
                Info.data = [];
            }

            GlobalData.info.push(item);
            Info.data.push(item);
        }

        re = new RegExp(/(\=|\!)\w*(?<=\w)/g);
        match;
        while ((match = re.exec(data)) !== null) {
            let [start, end] = [match.index + 1, match.index + match[0].length];
            let item: semanticData = {
                range: new Range(new Position(line, start), new Position(line, end)),
                text: match[0].trim().slice(1)
            }
            if (!Functions.data) {
                Functions.data = [];
            }
            
            GlobalData.functions.push(item);
            Functions.data.push(item);
        }
    }

    array.push(Sections);
    array.push(SectionsLinks);
    array.push(Info);
    array.push(Functions);
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

function isInRange(data: Range, selection: Position | Range): boolean {
    if (selection instanceof Position) {
        if ((data.start.line <= selection.line) && (selection.line <= data.end.line)) {
            return (data.start.character <= selection.character) && (selection.character <= data.end.character);
        }
    }
    else {
        if ((data.start.line <= selection.start.line) && (selection.start.line <= data.end.line)) {
            return (data.start.character <= selection.start.character) && (selection.start.character <= data.end.character);
        }
    }
    return false;
}

function getLogicFunctionsLua(filePath: string) {
    if (filePath) {
        let file = fs.readFileSync(String(filePath), 'utf8');
        let arr = file.replace(/\-\-\[\[(.|\s)*?\]\]\-\-/g, "").replace(/--.*?\n/g, "").split("\n");
        let func_arr = [];
        arr.forEach(element => {
            let re: RegExp = /^function .*?(?=\(.*?\)\n)/m;
            let text = re.exec(element.trim() + '\n');
            if (text) {
                func_arr.push(text[0].replace("function ", ""));
            }
        });
        return func_arr;
    }
    else {
        window.showErrorMessage('Error! Path: ' + String(filePath));
    }
}

function addCommonCompletion(): CompletionItemProvider<CompletionItem> {
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

            let item = (file, name, text, kind: CompletionItemKind) => {
                let data: CompletionItem = {
                    label: name,
                    kind: kind,
                }

                if (file) {
                    file = file.replace(".xml", "")
                    data.detail = file + "." + name;
                }
                else {
                    data.detail = name;
                }

                if (text) {
                    let temp = new MarkdownString(text);
                    temp.isTrusted = true;
                    temp.supportHtml = true;
                    data.documentation = temp;
                }
                return data;
            }

            let arr = [];

            let files = fs.readdirSync(dir);
            if (files && files !== []) {
                let ignoredFiles: string[] = workspace.getConfiguration("", window.activeTextEditor.document.uri).get("IgnoreLocalizationFile");
                files = files.filter(function (el) {
                    return ignoredFiles.indexOf(el) < 0;
                });

                files.forEach(file => {

                    (parseXML(path.resolve(dir, file)).string_table.string).forEach(file_item => {
                        let temp = item(file, file_item.$.id, file_item.text[0], CompletionItemKind.Variable);

                        arr.push(temp);
                    });
                });
            }

            let infoArray = [];
            GlobalData.info.forEach(dataItem => {
                if (!infoArray.includes(dataItem.text)) {
                    let temp = item(null, dataItem.text, null, CompletionItemKind.Unit);
                    infoArray.push(dataItem.text);
                    arr.push(temp);
                }
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
