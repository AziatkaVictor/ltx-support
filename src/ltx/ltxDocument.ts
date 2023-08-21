import {
    Range,
    Position,
    TextDocument,
    Uri,
    Diagnostic
} from "vscode";
import { LtxError } from "./Diagnostic/ltxError";
import { LtxLine } from "./ltxLine";
import { LtxSection } from "./ltxSection";
import { globalSenmaticsData, LtxSemantic, LtxSemanticDescription } from "./ltxSemantic";
import { getFileData } from "../utils/fileReader";
import { getParamsByFile } from "../utils/modulesParser";
import { isDiagnosticEnabled } from "../settings";
import { diagnosticCollection, diagnosticMap } from "../extension";
import { LtxDocumentType, LtxDocumentTypeParams } from "./ltxDocumentType";
import { SectionRepetitionError } from "./Diagnostic/Errors/SectionRepetition";
import { InvalidDeclarationError } from "./Diagnostic/Errors/InvalidDeclaration";
export var sectionsArray: string[];
export var currentFile: string;

/**
 * Главный класс, который отвечает за парсинг *.ltx файлов, сохранения структуры в переменные и массивы. 
 */
export class LtxDocument {
    readonly filePath: string
    readonly uri: Uri
    readonly text: string
    private sections: LtxSection[] = []
    private rawData: Map<number, LtxLine> = new Map<number, LtxLine>()
    private sectionsName: string[] = []

    private semanticData: LtxSemantic[] = []
    private errorsData: LtxError[] = []

    private fileType: LtxDocumentType
    private tempSection: LtxSection

    addError(error: LtxError) {
        error.setOwner(this);
        this.errorsData.push(error);
    }
    
    getErrorsByPosition(position: Position): LtxError[] {
        var data = [];
        for (const error of this.errorsData) {
            if (error.range.contains(position)) {
                data.push(error);
            }
        }
        return data;
    }

    getSections(): LtxSection[] {
        return this.sections;
    }

    getLines(): LtxLine[] {
        var lines = [];
        this.sections.map(section => {
            lines = lines.concat(Array.from(section.lines.values()))
        });
        return lines;
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

    getSemanticByPostition(position: Position): LtxSemantic {
        for (let semanticItem of this.semanticData) {
            if (semanticItem.range.contains(position)) {
                return semanticItem;
            }
        }
    }

    getType(): LtxDocumentType {
        return this.fileType;
    }

    async getSectionsByUri(uri: Uri): Promise<string[]> {
        return this.findAllSectionsNames(getFileData(uri.fsPath))
    }

    isInsideFunction(position: Position): boolean {
        const line = this.getLine(position);
        if (!line) {
            return false;
        }
        for (const condlist of line.condlists) {
            if (condlist.isInsideFunction(position)) {
                return true;
            }
        }
        return false;
    }

    isInsideCondition(position: Position): boolean {
        const line = this.getLine(position);
        if (!line) {
            return false;
        }
        for (const condlist of line.condlists) {
            if (condlist.isInsideCondition(position)) {
                return true;
            }
        }
        return false;
    }

    isInsideArgumentsGroup(position: Position): boolean {
        const line = this.getLine(position);
        if (!line) {
            return false;
        }

        const exp = /\(.*?\)/g
        var match;
        while ((match = exp.exec(line.rawData)) !== null) {
            if (match.index < position.character && (match.index + match[0].length) > position.character) {
                return true;
            }
        }
        return false;
    }

    inInsideCondlist(position: Position): boolean {
        const line = this.getLine(position);
        if (!line) {
            return false;
        }
        return line.inInsideCondlist(position);
    }

    isInsideSignal(position: Position): boolean {
        const line = this.getLine(position);
        if (!line) {
            return false;
        }
        return line.isInsideSignal(position);
    }

    isInsideCondlistGroups(position: Position): boolean {
        return this.isInsideCondition(position) || this.isInsideFunction(position);
    }

    canAddSectionLink(position: Position): boolean {
        return this.inInsideCondlist(position) && !this.isInsideCondlistGroups(position) && this.getLine(position).canHaveSectionLink()
    }

    /**
     * Получить данные строки по положению курсора в документе
     * @param position Курсор в текстовом документе 
     */
    getLine(position: Position): LtxLine {
        if (!position) {
            return null;
        }

        if (!this.getSection(position)) {
            if (!this.rawData.get(position.line)) {
                return null;
            }
            return this.rawData.get(position.line);
        }

        let sectionContent = this.getSection(position).lines;
        if (sectionContent) {
            return sectionContent.get(position.line);
        }
    }

    /**
     * Получить данные секции по положению курсора в документе
     * @param position Курсор в текстовом документе 
     */
    getSection(selection: Position): LtxSection | null {
        for (const section of this.sections) {
            if ((section.startLine <= selection.line) && (selection.line <= section.endLine)) {
                return section;
            }
        }
        return;
    }

    /**
     * Функция, которая вызывается в тот момент, когда заканчивается секция в документе. Так же в этой функции вызывается проверка параметров.
     * @param section Ссылка на секцию, которую нужно закрыть
     * @param index Номер строки
     */
    private closeSection(section: LtxSection, line?: number) {
        section.close(line);
        this.sections.push(section);
    }

    /**
     * Поиск объявления секции в тексте, если находим несколько секций, то возвращаем первую, остальные указываем как ошибки
     * @param text Текст, в котором ищем секцию
     * @param lineIndex Номер строки
     * @returns Возвращаем первую секцию, которую мы нашли
     */
    private findSection(text: string, lineIndex: number) {
        var re = /\[.*?\]/g;
        var match: RegExpExecArray;
        var result: RegExpExecArray;

        while ((match = re.exec(text)) !== null) {
            if (!result) {
                result = match;
                continue;
            }
            let range = new Range(new Position(lineIndex, match.index), new Position(lineIndex, match.index + match[0].length));
            let error = new InvalidDeclarationError(range, "В данной строке уже есть объявление секции", match[0]);
            this.addError(error);
        }

        return result;
    }

    /**
     * Парсинг текста, для поиска объявления секций.
     * @param text Текст, в котором необходимо найти секции
     * @returns Возвращаем массив с названием всех секций
     */
    private findAllSectionsNames(text: string, parent?: string[]): string[] {
        var re: RegExp = !parent ? /(?<=\[).+(?=\])/g : new RegExp("(?<=\\[).+(?=\\]\:(" + parent.join("|") + "))", "g");
        var match;
        sectionsArray = [];
        while ((match = re.exec(text)) !== null) {
            if (sectionsArray.includes(match[0])) {
                let substr = text.substring(0, match.index);
                let lineIndex = (substr.match(/\n/g) || []).length || 0;
                let range = new Range(new Position(lineIndex, substr.length - match.index + 1), new Position(lineIndex, substr.length - match.index + match[0].length + 1));
                if (this.getType() !== LtxDocumentType.Unknown) {
                    let error = new SectionRepetitionError(range, null, match[0]);
                    this.addError(error);
                }
            }
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
                this.closeSection(this.tempSection, lineIndex - 1);
            }
            this.tempSection = new LtxSection(result[0], lineIndex, result.index, this.fileType, this);
            return;
        }
        else if (this.tempSection) {
            if (args.indexOf('fast') === -1 || line.indexOf("[") === -1 || line.indexOf("]") === -1) {
                this.tempSection.addTempLine(lineIndex, line);
            }
            return;
        }
        this.rawData.set(lineIndex, new LtxLine(lineIndex, line, null));
    }

    private async parsingData(content: string, args: string[]) {
        let contentArray = content.split("\n");

        for (let lineIndex = 0; lineIndex < contentArray.length; lineIndex++) {
            let line = contentArray[lineIndex].replace(/;.*/, '');
            this.parseLine(line, lineIndex, args);
        }
        if (this.tempSection) {
            this.closeSection(this.tempSection, contentArray.length - 1);
        }

        for await (const section of this.sections) {
            section.parseLines();
        }

        if (isDiagnosticEnabled()) {
            this.validate();
        }
    }

    validate() {
        let canonicalFile = this.uri.toString();
        var diagnostics = [];
        this.errorsData.forEach(item => {
            let diagnosticItem = new Diagnostic(item.range, item.getDescription(), item.type);
            diagnosticItem.code = item.tag;
            diagnostics.push(diagnosticItem);
        });
        diagnosticMap.set(canonicalFile, diagnostics);
        diagnosticCollection.set(Uri.parse(canonicalFile), diagnostics);
    }

    private setDocumentType() {
        if (this.filePath.includes("configs\\scripts\\") || this.text.match(new RegExp(/\[logic(@.+)?\]/))) {
            this.fileType = LtxDocumentType.Logic;
        }
        else if (this.filePath.match(/tm\_.+.ltx/) || this.filePath.includes("task_manager.ltx")) {
            this.fileType = LtxDocumentType.Tasks;
        }
        else if (this.filePath.match(/squad_descr(\_.+)?.ltx/)) {
            this.fileType = LtxDocumentType.Squad;
        }
        else if (this.filePath.match(/script_sound(\_.+)?.ltx/)) {
            this.fileType = LtxDocumentType.Sound;
        }
        else if (this.filePath.includes("misc\\trade")) {
            this.fileType = LtxDocumentType.Trade;
        }
        else {
            this.fileType = LtxDocumentType.Unknown;
        }

    }

    getTypeParams() {
        var file = LtxDocumentTypeParams[this.getType()];
        return file ? getParamsByFile(file) : [];
    }

    /**
     * @param document Документ, который необходимо запарсить.
     * @param args[] Массив текстовых параметров, которые отвечают за поведение конструктора (например `fast` отключает все лишнее, чтобы ускорить процесс парсинга, нужен для предложения переменных в автодополнении) 
     */
    constructor(document: TextDocument | Uri, args: string[] = []) {
        this.filePath = document instanceof Uri ? document.fsPath : document.uri.fsPath;
        this.uri = document instanceof Uri ? document : document.uri;
        currentFile = this.filePath;
        this.text = document instanceof Uri ? getFileData(this.filePath) : document.getText();

        globalSenmaticsData.set(currentFile, []);

        this.setDocumentType();
        this.sectionsName = this.findAllSectionsNames(this.text);
        this.parsingData(this.text, args);

        this.semanticData = globalSenmaticsData.get(currentFile);
    }
}