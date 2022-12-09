import {
    Range,
    Position,
    TextDocument,
    Selection
} from "vscode";
import { addError, globalErrorsData, LtxError } from "./ltxError";
import { LtxLine } from "./ltxLine";
import { LtxSection } from "./ltxSection";
import { globalSenmaticsData, LtxSemantic } from "./ltxSemantic";
import { isIgnoreParamsDiagnostic } from "../settings";
export var sectionsArray: string[];
export var currentFile: string;

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

    private findSection(item, lineIndex : number) {
        var re = /\[[\w, @]+\]/g;
        var match : RegExpExecArray;
        var result : RegExpExecArray;

        while ((match = re.exec(item)) !== null) {
            if (!result) {
                result = match;
                continue;
            }
            // Добавляем ошибки, если секция в этой строке уже была найдена
            let range = new Range(new Position(lineIndex, match.index), new Position(lineIndex, match.index + match[0].length - 1));
            addError(range, "В данной строчке уже есть объявление секции.", match[0]);
        }
        
        return result;
    }

    /**
     * Парсинг текста, для поиска объявления секций.
     * @param text Текст, в котором необходимо найти секции
     * @returns Возвращаем массив с названием всех секций
     */
    private findAllSectionsNames(text : string) : string[] {
        let re = /(?<=\[)[\w, @]+(?=\])/g;
        let match;
        sectionsArray = [];
        while ((match = re.exec(text)) !== null) {
            sectionsArray.push(match[0]);
        }
        return sectionsArray;
    }

    private parseLine(contentArray, section, lineIndex, args) {
        let item = contentArray[lineIndex].replace(/;.*/, '');
        let result = this.findSection(item, lineIndex);

        if (result) {
            if (section) {
                this.closeSection(section, lineIndex);
            }
            section = new LtxSection(result[0], lineIndex, result.index);
        }
        else if (section) {
            if (item.trim() !== "" && args.indexOf('fast') === -1) {
                // Инициализация строки
                let lineData = new LtxLine(lineIndex, item, section.type);

                if (isIgnoreParamsDiagnostic() === false) {
                    // Если isValid ложно, то значит, что расширение не смогло найти в базе этой секции данный параметр. Выводим ошибку.
                    if (lineData.isPropertyValid === false) {
                        let range: Range = new Range(new Position(lineIndex, 0), new Position(lineIndex, item.length));
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
                        addError(new Range(new Position(lineIndex, 0), new Position(lineIndex, item.length)), "Некорректная запись.")
                    }
                }

                // Добавляем строку в массив, внутрь секции
                section.lines.set(lineIndex, lineData);
            }

            // Если это последняя строка документа, то закрываем секцию
            if (lineIndex === contentArray.length - 1) {
                this.closeSection(section, lineIndex);
            }
        }
        else if (!result) {
            this.rawData.set(lineIndex, new LtxLine(lineIndex, item, null));
        }
    }

    /**
     * @param document Документ, который необходимо запарсить.
     * @param args[] Массив текстовых параметров, которые отвечают за поведение конструктора (например `fast` отключает все лишнее, чтобы ускорить процесс парсинга, нужен для предложения переменных в автодополнении) 
     */ 
    constructor(document: TextDocument, args : string[] = []) {
        console.time('LtxDocument: '.concat(document.fileName));

        this.filePath = document.uri.fsPath;
        currentFile = document.uri.fsPath;
        var content = document.getText();

        // Массив с ошибками
        globalErrorsData.set(currentFile, []);
        globalSenmaticsData.set(currentFile, []);
        this.sectionsName = this.findAllSectionsNames(content);

        // TODO: Заменить на enum
        if (args.indexOf('fast') !== -1) {
            console.timeEnd('LtxDocument: '.concat(document.fileName))
            return;
        }

        let contentArray = content.split("\n");
        let section: LtxSection;

        for (let lineIndex = 0; lineIndex < contentArray.length; lineIndex++) {
            this.parseLine(contentArray, section, lineIndex, args);
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
        console.timeEnd('LtxDocument: '.concat(document.fileName));
    }
}