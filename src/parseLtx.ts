import {
    Range,
    Position,
    TextDocument,
    Selection
} from "vscode";
import { isIgnoreParamsDiagnostic } from "./settings";

/** Информация о секциях и их параметрах */
const SECTIONS_DATA = require("../data/sections_documintation.json").sections;
/** Информация о параметрах, которые используются в секциях */
const PARAMS_DATA = require("../data/sections_documintation.json").params;
/** Список параметров, которые есть в любой секции */
const CONDITIONS_DATA: string[] = require("../data/sections_documintation.json").basedConditions;

var globalErrorsData: Map<string, LtxError[]>       = new Map<string, LtxError[]>();
var globalSenmaticsData: Map<string, LtxSemantic[]> = new Map<string, LtxSemantic[]>();
var currentFile: string;
var currentFileSectionsArray: string[];

/**
 * Добавление ошибки в глобальный массив, лучше всего располагать под `isIgnoreParamsDiagnostic()`
 * @param range Положение ошибки в тексте
 * @param description Описание ошибки
 * @param element Имя элемента (необязательно)
 */
function addError(range: Range, description: string, element?: string) {
    if (element) {
        description = element + ": " + description;
    }
    let temp = globalErrorsData.get(currentFile);
    if (!temp) {
        temp = []
    }
    temp.push(new LtxError(element, range, description));
    globalErrorsData.set(currentFile, temp);
}

/**
 * Добавляем подсветку синтаксиса в глобальный массив
 * @param element Элемент подсветки синтаксиса
 */
function addSemantic(element: LtxSemantic) {
    let temp = globalSenmaticsData.get(currentFile);
    if (!temp) {
        temp = []
    }
    temp.push(element);
    globalSenmaticsData.set(currentFile, temp);
}

/**
 * Главный класс, который отвечает за парсинг *.ltx файлов, сохранения структуры в переменные и массивы. 
 */ 
export class LtxDocument {
    readonly filePath: string

    private data: LtxSection[] = []
    private rawData: Map<number, LtxLine> = new Map<number, LtxLine>()
    private sectionsName: string[] = []
    private semanticData: LtxSemantic[]

    readonly errorsData: LtxError[]

    getSections(): LtxSection[] {
        return this.data;
    }

    getSectionsName(): string[] {
        return this.sectionsName;
    }

    getSemanticData(): LtxSemantic[] {
        return this.semanticData;
    }
    
    getErrorsData() : LtxError[] {
        return this.errorsData;
    }    

    /**
     * Получить данные строки по положению курсора в документе
     * @param selection Курсор в текстовом документе 
     * @returns Возвращает данные строки, в которой находиться курсор
     */
    getLine(selection : Selection) : LtxLine {
        // Проверяем наличие курсора в текстовом документе
        if (!selection) {
            return null;
        }
        let startPosition = selection.start;

        // Проверка, на отсутствие секции по положению курсора
        if (!this.getSectionByPosition(startPosition)) {
            if (!this.rawData.get(startPosition.line)) {
                return null;
            }
            return this.rawData.get(startPosition.line);
        }

        // Проверяем, можем ли мы найти секцию, внутри которой находиться курсор
        let sectionContent = this.getSectionByPosition(startPosition).lines;
        if (sectionContent) {
            return sectionContent.get(startPosition.line);
        }
    }

    getSectionByPosition(selection: Position): LtxSection | null {
        try {
            let temp;
            this.data.forEach(section => {
                if ((section.startLine <= selection.line) && (selection.line <= section.endLine)) {
                    temp = section;
                }
            });
            return temp;
        }
        catch (error) {
            console.log(error);
            return;
        }
    }

    /**
     * Функция, которая вызывается в тот момент, когда заканчивается секция в документе. Так же в этой функции вызывается проверка параметров.
     * @param section Ссылка на секцию, которую нужно закрыть
     * @param index Номер строки
     */
    private closeSection(section: LtxSection, index: number) {
        section.setEndLine(index);
        if (isIgnoreParamsDiagnostic() === false) {
            section.checkExceptedParams();
        }
        this.data.push(section);
    }

    /**
     * @param path Документ, который необходимо запарсить.
     * @param args[] Массив текстовых параметров, которые отвечают за поведение конструктора (например `fast` отключает все лишнее, чтобы ускорить процесс парсинга, нужен для предложения переменных в автодополнении) 
     */ 
    constructor(path: TextDocument, args : string[] = []) {
        let content;
        console.time('LtxDocument: '.concat(path.fileName));

        this.filePath = path.uri.fsPath;
        content = path.getText();
        currentFile = path.uri.fsPath;

        // Массив с ошибками
        globalErrorsData.set(currentFile, []);
        globalSenmaticsData.set(currentFile, []);

        let re = /(?<=\[)[\w, @]+(?=\])/g;
        let match;
        currentFileSectionsArray = [];
        while ((match = re.exec(content)) !== null) {
            currentFileSectionsArray.push(match[0]);
        }
        this.sectionsName = currentFileSectionsArray;

        // TODO: Заменить на enum
        if (args.indexOf('fast') !== -1) {
            console.timeEnd('LtxDocument: '.concat(path.fileName))
            return;
        }

        let contentArray = content.split("\n");
        let section: LtxSection;

        for (let line = 0; line < contentArray.length; line++) {
            let item = contentArray[line].replace(/;.*/, '');

            let re = /\[[\w, @]+\]/g;
            let match;
            let result;

            while ((match = re.exec(item)) !== null) {
                if (!result) {
                    result = match;
                }
                else {
                    // Добавляем ошибки, если секция в этой строке уже была найдена
                    let range: Range = new Range(new Position(line, match.index), new Position(line, match.index + match[0].length - 1));
                    addError(range, "В данной строчке уже есть объявление секции.", match[0]);
                }
            }

            if (result) {
                if (section) {
                    this.closeSection(section, line);
                }
                section = new LtxSection(result[0], line, result.index);
            }
            else if (section) {
                if (item.trim() !== "" && args.indexOf('fast') === -1) {
                    // Инициализация строки
                    let lineData = new LtxLine(line, item, section.type);

                    if (isIgnoreParamsDiagnostic() === false) {
                        // Если isValid ложно, то значит, что расширение не смогло найти в базе этой секции данный параметр. Выводим ошибку.
                        if (lineData.isPropertyValid === false) {
                            let range: Range = new Range(new Position(line, 0), new Position(line, item.length));
                            addError(range, "Некорректный параметр.", lineData.propertyName);
                        }
                        else {
                            // Если isValidConditions ложно, то значит, что было указано условие, хотя параметр того не поддерживает. Выводим ошибку.
                            if (!lineData.isValidConditions()) {
                                // TODO: Сделать отправку ошибки кондишена
                                // let range = lineData.data.get("conditions").range;
                                // let text = "Параметр не может содержать условия.";
                                // addError(range, text, lineData.propertyName);
                            }
                            // Если isValidFunctions ложно, то значит, что было указаны функции, хотя параметр того не поддерживает. Выводим ошибку.
                            if (!lineData.isValidFunctions()) {
                                // TODO: Сделать отправку ошибки функций
                                // let range = lineData.data.get("functions").range;
                                // let text = "Параметр не может содержать функции.";
                                // addError(range, text, lineData.propertyName);
                            }
                        }

                        if (lineData.IsValidParamSyntax()) {
                            // Если isHaveResult ложно, то значит, что у строки нету значения. Выводим ошибку.
                            if (!lineData.IsHasResult()) {
                                addError(lineData.propertyRange, "Параметр не может быть пустым.", lineData.propertyName);
                            }
                        }
                        else {
                            addError(new Range(new Position(line, 0), new Position(line, item.length)), "Некорректная запись.")
                        }
                    }

                    // Добавляем строку в массив, внутрь секции
                    section.lines.set(line, lineData);
                }

                // Если это последняя строка документа, то закрываем секцию
                if (line === contentArray.length - 1) {
                    this.closeSection(section, line);
                }
            }
            else if (!result) {
                this.rawData.set(line, new LtxLine(line, item, null));
            }
        }

        if (isIgnoreParamsDiagnostic() === false) {
            for (let i = 0; i < this.data.length; i++) {
                const element_i = this.data[i];

                for (let k = 0; k < this.data.length; k++) {
                    if (k !== i) {
                        const element_k = this.data[k];

                        if (element_i.name === element_k.name) {
                            addError(element_i.linkRange, "Повторение имени секции.", element_i.name)
                        }
                    }
                }
            }
        }
  
        this.semanticData = globalSenmaticsData.get(currentFile);
        this.errorsData = globalErrorsData.get(currentFile);
        console.timeEnd('LtxDocument: '.concat(path.fileName));
    }
}

class LtxSection {
    readonly name: string
    readonly type: LtxSectionType
    readonly startLine: number
    readonly linkRange?: Range
    endLine?: number
    lines: Map<number, LtxLine> = new Map<number, LtxLine>()

    checkExceptedParams() {
        let data = [];
        this.lines.forEach(line => {
            data.push(line.propertyName);
        });

        this.type.params.forEach(element => {
            if (element.isOptional === false) {
                if (data.indexOf(element.name) === -1) {
                    addError(this.linkRange, "Отсутствует необходимый параметр.", element.name)
                }
            }
        });
    }

    setEndLine(line: number) {
        this.endLine = line;
        if (this.lines.size === 0) {
            addError(this.linkRange, "Секция должна содержать параметры. Если хотите закончить логику, то лучше использовать nil.", this.name);
        }
    }

    constructor(name: string, startLine: number, startCharacter: number) {
        this.name = name;
        this.type = new LtxSectionType((/^\w*[^\@.*]/.exec(name.slice(1, name.length - 1)))[0]);
        this.linkRange = new Range(new Position(startLine, startCharacter + 1), new Position(startLine, startCharacter + name.length - 1))
        addSemantic(new LtxSemantic(LtxSemanticType.struct, LtxSemanticModification.declaration, this.linkRange, LtxSemanticDescription.signal, this.name))
        this.startLine = startLine;

        if (this.type.isValid === false) {
            addError(this.linkRange, "Неизвестный тип секции.", this.name);
        }
    }
}

class LtxSectionType {
    readonly name: string
    readonly params: Map<string, LtxSectionProperty>
    readonly isValid: boolean

    constructor(name: string) {
        this.name = name
        this.params = new Map<string, LtxSectionProperty>();

        if (SECTIONS_DATA[name]) {
            // Получаем название параметров нужной нам секции, из файла json
            let keys: string[] = Object.keys(SECTIONS_DATA[name]);
            keys = keys.concat(CONDITIONS_DATA);

            // Перебираем их
            keys.forEach(itemName => {
                let property: LtxSectionProperty | null = null;

                if (!CONDITIONS_DATA.includes(itemName)) {
                    let item = SECTIONS_DATA[name][itemName];
                    if (Object.keys(item).length !== 0) {
                        if (!item.isOptional) {
                            property = new LtxSectionProperty(itemName, item.isOptional)
                        }
                    }
                    else {
                        property = new LtxSectionProperty(itemName)
                    }
                }
                else {
                    property = new LtxSectionProperty(itemName)
                }

                if (property) {
                    this.params.set(itemName, property);
                }
            });
            this.isValid = true
        }
        else {
            this.isValid = false
        }
    }
}

class LtxSectionProperty {
    readonly name: string
    readonly dataType: "condlist" | "boolean" | "number" | "string" | "string_and_condlist" | "number_and_condlist"
    readonly isCanHaveConditions: boolean = true
    readonly isCanHaveFunctions: boolean = true
    readonly isCanHaveLink: boolean = true
    readonly isCanHaveCallback: boolean = false
    readonly isOptional: boolean = true

    constructor(name: string, isOptional?: boolean) {
        if (PARAMS_DATA[name]) {
            this.dataType = PARAMS_DATA[name].type;

            switch (this.dataType) {
                case "boolean":
                    this.isCanHaveFunctions = false;
                    this.isCanHaveLink = false;
                    this.isCanHaveCallback = false;
                    break;

                case "number":
                    this.isCanHaveFunctions = false;
                    this.isCanHaveLink = false;
                    this.isCanHaveCallback = false;
                    break;

                case "string":
                    this.isCanHaveFunctions = false;
                    this.isCanHaveLink = false;
                    this.isCanHaveCallback = false;
                    break;

                case "string_and_condlist":
                    this.isCanHaveCallback = true;
                    break;

                case "number_and_condlist":
                    this.isCanHaveCallback = true;
                    break;

                default:
                    this.dataType = "condlist";
                    break;
            }

            if (isOptional === false) {
                this.isOptional = isOptional;
            }
        }
        else {
            return null;
        }
    }
}

class LtxLine {
    readonly index: number

    readonly propertyName: string
    readonly propertyRange: Range
    readonly propertySettings: LtxSectionProperty
    readonly isPropertyValid: boolean

    readonly rawData: string

    readonly condlists: LtxCondlist[] = []

    constructor(index: number, data: string, sectionType: LtxSectionType) {
        this.index = index;
        this.rawData = data;
        var param;

        try {
            // Поиск названия параметра, например on_info = nil. Тут параметр on_info
            let re = /^(\s*?)?[\w\$]+?(?=(\s*?)?\=)/gm;
            param = re.exec(data);
        } catch (error) {
            console.log(error);
            return null;
        }

        if (param) {
            // Указываем название и тип строки
            this.propertyName = param[0].trim();
            this.propertyRange = new Range(new Position(index, param.index), new Position(index, param.index + param[0].length))
            addSemantic(new LtxSemantic(LtxSemanticType.property, LtxSemanticModification.readonly, this.propertyRange, LtxSemanticDescription.signal, this.propertyName))

            if (sectionType) {
                if (sectionType.params.get(param[0].trim())) {
                    let property = sectionType.params.get(param[0].trim());
                    this.propertySettings = property;
                    this.isPropertyValid = true;
                }
                else {
                    this.isPropertyValid = false;
                }
            }
            var tempData = data + "\n";

            // Поиск всех сигналов
            if (this.rawData.indexOf("|") !== -1) {
                let search = /(?<=(\=|\|)).+?(?=\|)/g
                let match;
                while ((match = search.exec(this.rawData)) !== null) {
                    let tempRange = new Range(new Position(index, match.index), new Position(index, match.index + match[0].length))

                    if (match[0].trim().toLowerCase().indexOf("true") !== -1 || match[0].trim().toLowerCase().indexOf("false") !== -1) {
                        addSemantic(new LtxSemantic(LtxSemanticType.keyword, null, tempRange, LtxSemanticDescription.signal, match[0]))
                    }
                    else if (!isNaN(+(match[0].trim()))) {
                        addSemantic(new LtxSemantic(LtxSemanticType.number, null, tempRange, LtxSemanticDescription.signal, match[0]))
                    }
                    else {
                        addSemantic(new LtxSemantic(LtxSemanticType.string, null, tempRange, LtxSemanticDescription.signal, match[0]))
                    }

                    let tempReplace = " ".repeat(1 + match[0].length) + "=";
                    tempData = tempData.replace("=" + match[0] + "|", tempReplace);
                }
            }

            // Поиск всех condlist
            let re = /(?<=(\=|\,)).+?(?=(\,|\\n|$))/gm;
            let match;
            while ((match = re.exec(tempData)) !== null) {
                this.condlists.push(new LtxCondlist(index, match.index, match[0]));
            }
        }
        else {
            this.isPropertyValid = false;
        }
    }

    // TODO: Сделать проверку кондишина
    isValidConditions() {
        return true;
    }

    // TODO: Сделать проверку функций
    isValidFunctions() {
        return true;
    }

    IsValidParamSyntax() {
        try {
            let re = new RegExp(this.propertyName + "(\\s)?\=");
            let match = re.exec(this.rawData);
            if (!match) {
                return false;
            }
            return true;
        }
        catch (error) {
            console.log(error);
            return false;
        }
    }

    IsHasResult() {
        try {
            let match = /(?<=\=).+/.exec(this.rawData)
            if (!match) {
                return false;
            }
            return true;
        }
        catch (error) {
            console.log(error);
            return false;
        }
    }
}

class LtxSectionLink {
    name: string
    section: LtxSection
    start: Position
    end: Position

    setLink(section: LtxSection) {
        this.section = section;
    }

    constructor(name: string, start: Position, end: Position) {
        this.name = name;
        this.start = start;
        this.end = end;
    }
}

class LtxCondlist {
    readonly condition?;
    readonly conditionRange?: Range | null;
    readonly function?;
    readonly functionRange?: Range | null;
    readonly sectionLink?: LtxSectionLink;

    constructor(lineNumber: number, index: number, data: string) {
        let tempData = data;

        this.condition = /\{.*?\}/.exec(tempData);
        this.function = /\%.*?\%/.exec(tempData);

        if (this.condition) {
            this.conditionRange = new Range(new Position(lineNumber, index + this.condition.index), new Position(lineNumber, index + this.condition[0].length + this.condition.index));
        }
        if (this.function) {
            this.functionRange = new Range(new Position(lineNumber, index + this.function.index), new Position(lineNumber, index + this.function[0].length + this.function.index));
        }

        let search = /(\+|\-)\w*\b(?<=\w)/g
        let match;
        while ((match = search.exec(tempData)) !== null) {
            let tempRange = new Range(new Position(lineNumber, index + match.index), new Position(lineNumber, index + match.index + match[0].length))
            addSemantic(new LtxSemantic(LtxSemanticType.variable, LtxSemanticModification.declaration, tempRange, LtxSemanticDescription.signal, match[0]))
            tempData = replaceText(tempData, match[0]);
        }

        search = /(\=|\!)\w*\b(?<=\w)/g
        while ((match = search.exec(tempData)) !== null) {
            let tempRange = new Range(new Position(lineNumber, index + match.index), new Position(lineNumber, index + match.index + match[0].length))
            addSemantic(new LtxSemantic(LtxSemanticType.function, LtxSemanticModification.declaration, tempRange, LtxSemanticDescription.signal, match[0]))
            tempData = replaceText(tempData, match[0]);
        }

        search = new RegExp("\\b(nil|true|false|complete|fail)\\b", "g")
        while ((match = search.exec(tempData)) !== null) {
            let tempRange = new Range(new Position(lineNumber, index + match.index), new Position(lineNumber, index + match.index + match[0].length))
            addSemantic(new LtxSemantic(LtxSemanticType.keyword, LtxSemanticModification.readonly, tempRange, LtxSemanticDescription.signal, match[0]))
            tempData = replaceText(tempData, match[0]);
        }

        search = /(?<!\w)\d+/g
        while ((match = search.exec(tempData)) !== null) {
            let tempRange = new Range(new Position(lineNumber, index + match.index), new Position(lineNumber, index + match.index + match[0].length))
            addSemantic(new LtxSemantic(LtxSemanticType.number, null, tempRange, LtxSemanticDescription.signal, match[0]))
            tempData = replaceText(tempData, match[0]);
        }

        for (let сount = 0; сount < currentFileSectionsArray.length; сount++) {
            const sectionName = currentFileSectionsArray[сount];
            search = new RegExp("(?<=\\b)" + sectionName + "(?![\\w\\@]+)(?=\\b)", "g")
            while ((match = search.exec(tempData)) !== null) {
                let tempRange = new Range(new Position(lineNumber, index + match.index), new Position(lineNumber, index + match.index + match[0].length))
                addSemantic(new LtxSemantic(LtxSemanticType.class, LtxSemanticModification.definition, tempRange, LtxSemanticDescription.signal, match[0]))
                tempData = replaceText(tempData, sectionName);
            }
        }

        search = /[\w\*\.\@\$]+/g
        while ((match = search.exec(tempData)) !== null) {
            let tempRange = new Range(new Position(lineNumber, index + match.index), new Position(lineNumber, index + match.index + match[0].length))
            addSemantic(new LtxSemantic(LtxSemanticType.string, null, tempRange, LtxSemanticDescription.signal, match[0]))
            tempData = replaceText(tempData, match[0]);
        }
    }

}

function replaceText(data, text) {
    let tempReplace = " ".repeat(text.length);
    return data.replace(new RegExp("(?<=\\b)\\" + text + "(?=\\b)"), tempReplace);
}

class LtxError {
    data: string
    range: Range
    descr: string

    constructor(data: string, range: Range, descr: string) {
        this.data = data;
        this.range = range;
        this.descr = descr;
    }
}


/**
 * Класс, который используется для подсветки синтаксиса.
 * 
 * @param type - enum, который характеризует тип (переменяя, функция)
 * @param modification - enum, который характеризует метод использования (объявление, ссылка)
 * @param description - enum, который я планирую использовать для анализа кода
 * @param range - Range, индексы начала и конца текста, который надо подсветить
 */
class LtxSemantic {
    type: LtxSemanticType
    modification: LtxSemanticModification | null
    description?: LtxSemanticDescription
    text?: string
    range: Range

    constructor(type: LtxSemanticType, modification: LtxSemanticModification | null, range: Range, description?: LtxSemanticDescription, text?: string) {
        this.type = type;
        this.modification = modification;
        this.range = range;
        this.description = description;
        this.text = text;
    }
}

enum LtxSemanticType {
    variable = "variable",
    function = "function",
    keyword = "keyword",
    class = "class",
    number = "number",
    string = "string",
    struct = "struct",
    property = "property"
}

enum LtxSemanticModification {
    declaration = "declaration",
    readonly = "readonly",
    definition = "definition",
    documentation = "documentation"
}

enum LtxSemanticDescription {
    signal = "signal"
}