import {
    Range,
    Position,
    TextDocument,
    Uri,
    DiagnosticSeverity
} from "vscode";
import { addError, globalErrorsData, LtxError } from "./ltxError";
import { LtxLine } from "./ltxLine";
import { LtxSection } from "./ltxSection";
import { globalSenmaticsData, LtxSemantic, LtxSemanticDescription } from "./ltxSemantic";
import { isIgnoreParamsDiagnostic } from "../settings";
import { getFileData } from "../lua/fileReader";
export var sectionsArray: string[];
export var currentFile: string;

export enum LtxDocumentType {
    Logic,
    Squad,
    Tasks
}

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

    private fileType: LtxDocumentType
    private tempSection: LtxSection

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

    getSemanticByPostition(position : Position): LtxSemantic {
        for (let semanticItem of this.semanticData) {
            if (semanticItem.range.contains(position)) {
                return semanticItem;
            }
        }
    }
    
    getErrorsData() : LtxError[] {
        return this.errorsData;
    }   
    
    
    getType() : LtxDocumentType {
        return this.fileType;
    }
    

    async getSectionsByUri(uri : Uri) : Promise<string[]> {
        return this.findAllSectionsNames(getFileData(uri.fsPath))
    }

    isInsideFunctionGroup(position : Position) : boolean {
        var condlists = this.getLine(position).condlists;
        for (let index = 0; index < condlists.length; index++) {
            const element = condlists[index];
            if (!element.functionRange) {
                continue;
            }
            if (element.functionRange.contains(position)) {
                return true;
            }
        }
        return false;
    }

    isInsideConditionGroup(position : Position) : boolean {
        var condlists = this.getLine(position).condlists;
        for (let index = 0; index < condlists.length; index++) {
            const element = condlists[index];
            if (!element.conditionRange) {
                continue;
            }
            if (element.conditionRange.contains(position)) {
                return true;
            }
        }
        return false;
    }

    isInsideArgumentsGroup(position : Position) : boolean {
        var line = this.getLine(position).rawData;
        var exp = /\(.*?\)/g
        var match;
        while ((match = exp.exec(line)) !== null) {
            if (match.index < position.character && (match.index + match[0].length) > position.character) {
                return true;
            }
        }
        return false;
    }

    /**
     * Получить данные строки по положению курсора в документе
     * @param position Курсор в текстовом документе 
     * @returns Возвращает данные строки, в которой находиться курсор
     */
    getLine(position : Position) : LtxLine {
        // Проверяем наличие курсора в текстовом документе
        if (!position) {
            return null;
        }

        // Проверка, на отсутствие секции по положению курсора
        if (!this.getSectionByPosition(position)) {
            if (!this.rawData.get(position.line)) {
                return null;
            }
            return this.rawData.get(position.line);
        }

        // Проверяем, можем ли мы найти секцию, внутри которой находиться курсор
        let sectionContent = this.getSectionByPosition(position).lines;
        if (sectionContent) {
            return sectionContent.get(position.line);
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
    private closeSection(section: LtxSection) {
        section.close();
        this.sections.push(section);
    }

    /**
     * Поиск объявления секции в тексте, если находим несколько секций, то возвращаем первую, остальные указываем как ошибки
     * @param text Текст, в котором ищем секцию
     * @param lineIndex Номер строки
     * @returns Возвращаем первую секцию, которую мы нашли
     */
    private findSection(text : string, lineIndex : number) {
        var re = /\[[\w@]*\]/g;
        var match : RegExpExecArray;
        var result : RegExpExecArray;

        while ((match = re.exec(text)) !== null) {
            if (!result) {
                result = match;
                continue;
            }
            // Добавляем ошибки, если секция в этой строке уже была найдена
            let range = new Range(new Position(lineIndex, match.index), new Position(lineIndex, match.index + match[0].length));
            addError(range, "В данной строке уже есть объявление секции.", match[0], DiagnosticSeverity.Error, "Remove");
        }
        
        return result;
    }

    /**
     * Парсинг текста, для поиска объявления секций.
     * @param text Текст, в котором необходимо найти секции
     * @returns Возвращаем массив с названием всех секций
     */
    private findAllSectionsNames(text : string) : string[] {
        let re = /(?<=\[)[\w@]+(?=\])/g;
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
                this.closeSection(this.tempSection);
            }
            this.tempSection = new LtxSection(result[0], lineIndex, result.index, this.fileType);
            return;
        }
        else if (this.tempSection) {
            if (args.indexOf('fast') === -1 || line.indexOf("[") === -1 || line.indexOf("]") === -1) {
                this.tempSection.addTempLine(lineIndex, line);
            }  
            return;
        }
        this.rawData.set(lineIndex, new LtxLine(lineIndex, line));
    }

    private async parsingSections(content : string, args : string[]) {
        let contentArray = content.split("\n");

        for (let lineIndex = 0; lineIndex < contentArray.length; lineIndex++) {
            let line = contentArray[lineIndex].replace(/;.*/, '');
            this.parseLine(line, lineIndex, args);
        }
        // Закрываем последнюю секцию
        if (this.tempSection) {
            this.closeSection(this.tempSection);
        }

        // Асинхронно анализируем строки
        for await (const section of this.sections) {
            section.parseLines();
        }    
    }
    
    private setDocumentType() {
        if (this.filePath.indexOf("configs/scripts") !== -1) {
            this.fileType = LtxDocumentType.Logic;
        }
        else if (this.filePath.match(/tm\_.+.ltx/)) {
            this.fileType = LtxDocumentType.Tasks;
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
        this.setDocumentType();

        // Массив с ошибками
        globalErrorsData.set(currentFile, []);
        globalSenmaticsData.set(currentFile, []);

        var content = document.getText();
        this.sectionsName = this.findAllSectionsNames(content);

        // TODO: Заменить на enum
        if (args.indexOf('fast') !== -1) {
            console.timeEnd('LtxDocument (Fast): '.concat(document.fileName))
            return;
        }
        
        this.parsingSections(content, args);

        // FIXME Неверный цикл
        if (isIgnoreParamsDiagnostic() === false) {
            let start = 0;
            let end = this.sections.length -1;
            while (start < end) { 
                if (this.sections[start].name === this.sections[end].name) {
                    addError(this.sections[end].linkRange, "Повторение имени секции.", this.sections[end].name)
                }
                if (start % 2 === 0) start += 1;
                else end -= 1;
            }
        }
  
        this.semanticData = globalSenmaticsData.get(currentFile);
        this.errorsData = globalErrorsData.get(currentFile);
        console.timeEnd('LtxDocument: '.concat(document.fileName));
    }
}