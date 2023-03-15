import * as fs from 'fs';
import * as path from 'path';
import { workspace } from 'vscode';
import { parseString } from 'xml2js';
import { Iconv } from "iconv";

/**
 * Чтение файла, в обход VSCode API, чтобы не генерировать автодополнение текста в памяти.
 */
export function getFileData(path: string): string | null {
    if (fs.existsSync(path)) {
        return fs.readFileSync(path, "utf8");
    }
}

/**
 * Анализ файла, с поиском его в данных расширения и пользовательской папке. Крайне удобно когда необходимо получить информацию о чем-то, что может быть модифицированно в проекте.
 * 
 * Не сканирует папки, работает лишь по строго указанному пути. Обычно нужно для поиска определённых объявлений или объектов в других файлах.
 * 
 * @param firstPath путь к пользовательским файлам
 * @param secondPath путь к данным расширения
 * @param callback функция, которая анализирует данные
 * @returns результат функции `callback`
 */
export function analyzeFile(name: string, firstPath: string, secondPath: string, callback: (path: string) => string[]): string[] {
    var item = (workspace.workspaceFolders[0].uri.path + "/" + firstPath + name).replace(/\//g, "\\");
    item = item.slice(1, item.length);

    if (fs.existsSync(item)) {
        return callback(path.resolve(item));
    }
    return callback(path.resolve(__dirname, secondPath + "./" + name));
}

/**
 * Получить информацию из `*.xml` файла. Поддерживает `cp1251` кодировку
 */
export function getXmlData(file: string): string[] {
    const iconv = new Iconv('cp1251', 'UTF-8');
    var text = String(iconv.convert(fs.readFileSync(file))).replace("\"#$&'()*+-./:;<=>?@[]^_`{|}~", "");
    var data;

    parseString(text, function (err, result) {
        if (err) {
            console.log(file + '\nThere was an error when parsing: ' + err);
        }
        else {
            data = result;
        }
    });
    return data.string_table.string;
}

/**
 * Получить список элементов из файла `*.lua`
 * @param callback фукнция, которая будет обрабатывать получаемые данные
 * @param removeSame убрать из массива повторяющиеся элементы? По умолчанию true.
 */
export function findLuaElements(path: string, re: RegExp, callback: (match) => string, removeSame: boolean = true): string[] {
    var text = getClearLuaFile(path);
    var match;
    var data = [];
    while ((match = re.exec(text)) !== null) {
        data.push(callback(match));
    }
    if (removeSame) {
        return Array.from(new Set(data));
    }
    return data;
}

/**
 * Получить файл `*.lua` без комментариев, если файла не существует, то вызывается ошибка
 */
export function getClearLuaFile(path: string): string {
    let file = getFileData(path);
    if (!file) {
        throw new Error("File is null: " + path);
    }
    return removeLuaComments(file);
}

/**
 * Убирает комменарии из `*.lua` файла
 */
export function removeLuaComments(file: string): string {
    return file.replace(/--\[\[((.|\n)*?)\]\]/g, "").replace(/--.*(?=$)/gm, "");
}