import {
    Range,
    Position,
    TextDocument,
    Selection,
    Uri,
    workspace
} from "vscode";
import { addError, globalErrorsData, LtxError } from "./ltxError";
import { LtxLine } from "./ltxLine";
import { LtxSection } from "./ltxSection";
import { globalSenmaticsData, LtxSemantic, LtxSemanticDescription, LtxSemanticType } from "./ltxSemantic";
import { isIgnoreParamsDiagnostic } from "../settings";
import { TextDecoder } from "util";
export var sectionsArray: string[];
export var currentFile: string;

/**
 * Главный класс, который отвечает за парсинг *.ltx файлов, сохранения структуры в переменные и массивы. 
 */ 
export class LtxDocument {
    readonly filePath: string
    private sections: LtxSection[] = []
    private rawData: Map<number, LtxLine> = new Map<number, LtxLine>()
    private sectionsName: string[] = []
    private semanticData: LtxSemantic[]
    readonly errorsData: LtxError[]

    private tempSection: LtxSection;

    getSections(): LtxSection[] {
        return this.sections;
    }

    getInfos(): string[] {
        let items = []
        for (const item of this.semanticData) {
            if (item.description === LtxSemanticDescription.info) {
                items.push(item.text.slice(1, item.text.length))
            }
        }
        return items;
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

    async getSectionsByUri(uri : Uri) : Promise<string[]> {
        return this.findAllSectionsNames(new TextDecoder().decode(await workspace.fs.readFile(uri)))
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
            this.sections.forEach(section => {
                if ((section.startLine <= selection.line) && (selection.line <= section.endLine)) {
                    temp = section;
                    return;
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
        section.close(index);
        this.sections.push(section);
    }

    /**
     * Поиск объявления секции в тексте, если находим несколько секций, то возвращаем первую, остальные указываем как ошибки
     * @param text Текст, в котором ищем секцию
     * @param lineIndex Номер строки
     * @returns Возвращаем первую секцию, которую мы нашли
     */
    private findSection(text : string, lineIndex : number) {
        var re = /\[[\w, @]+\]/g;
        var match : RegExpExecArray;
        var result : RegExpExecArray;

        while ((match = re.exec(text)) !== null) {
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

    private parseLine(line: string, lineIndex: number, args: string[]) {
        if (line.trim() === "") {
            return;
        }
        let result = this.findSection(line, lineIndex);

        if (result) {
            if (this.tempSection) {
                this.closeSection(this.tempSection, lineIndex);
            }
            this.tempSection = new LtxSection(result[0], lineIndex, result.index);
            return;
        }
        else if (this.tempSection) {
            if (args.indexOf('fast') === -1) {
                this.tempSection.addTempLine(lineIndex, line);
            }  
            return;
        }
        this.rawData.set(lineIndex, new LtxLine(lineIndex, line, null));
    }

    private async parsingSections(content : string, args : string[]) {
        let contentArray = content.split("\n");

        for (let lineIndex = 0; lineIndex < contentArray.length; lineIndex++) {
            let line = contentArray[lineIndex].replace(/;.*/, '');
            this.parseLine(line, lineIndex, args);
        }
        // Закрываем последнюю секцию
        if (this.tempSection) {
            this.closeSection(this.tempSection, contentArray.length - 1);
        }

        // Асинхронно анализируем строки
        for await (const section of this.sections) {
            section.parseLines();
        }    
    }

    /**
     * @param document Документ, который необходимо запарсить.
     * @param args[] Массив текстовых параметров, которые отвечают за поведение конструктора (например `fast` отключает все лишнее, чтобы ускорить процесс парсинга, нужен для предложения переменных в автодополнении) 
     */ 
    constructor(document: TextDocument, args : string[] = []) {
        if (args.indexOf('fast') !== -1) {
            console.time('LtxDocument (Fast): '.concat(document.fileName));
        }
        else {
            console.time('LtxDocument: '.concat(document.fileName));
        }

        this.filePath = document.uri.fsPath;
        currentFile = document.uri.fsPath;
        var content = document.getText();

        // Массив с ошибками
        globalErrorsData.set(currentFile, []);
        globalSenmaticsData.set(currentFile, []);
        this.sectionsName = this.findAllSectionsNames(content);

        // TODO: Заменить на enum
        if (args.indexOf('fast') !== -1) {
            console.timeEnd('LtxDocument (Fast): '.concat(document.fileName))
            return;
        }
        
        this.parsingSections(content, args);

        if (isIgnoreParamsDiagnostic() === false) {
            for (let i = 0; i < this.sections.length; i++) {
                const element_i = this.sections[i];

                for (let k = 0; k < this.sections.length; k++) {
                    if (k !== i) {
                        const element_k = this.sections[k];

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