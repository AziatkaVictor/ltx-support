import { OutputChannel, window } from "vscode";

export enum LoggerLevel {
    debug,
    info,
    warn,
    error,
    tests,
    off
};

export class Logger {
    private static _instance: Logger;
    private outputChannel: OutputChannel;
    private level = LoggerLevel.info;

    private static timeColor: string = "\u001b[2m\u001b[37m";
    private static specColor: string = "\u001b[35m";
    private static debugColor: string = "\u001b[36m";
    private static infoColor: string = "\u001b[34m";
    private static warnColor: string = "\u001b[33m";
    private static errorColor: string = "\u001b[31m";
    private static successColor: string = "\u001b[32m";
    private static failColor: string = "\u001b[31m";
    private static symbolsCount: number = 8;

    private constructor() {
        this.outputChannel = window.createOutputChannel('LTX Support', "log");
        this.outputChannel.show();
    }

    private get time(): string {
        const dt: Date = new Date(Date.now());

        const year: string = dt.getFullYear().toString();
        const month: string = dt.getMonth().toString().padStart(2, '0');
        const date: string = dt.getDate().toString().padStart(2, '0');
        const hour: string = dt.getHours().toString().padStart(2, '0');
        const minute: string = dt.getMinutes().toString().padStart(2, '0');
        const second: string = dt.getSeconds().toString().padStart(2, '0');
        const millisecond: string = dt.getMilliseconds().toString().padStart(3, '0');

        return `${year}-${month}-${date} ${hour}:${minute}:${second}.${millisecond}`;
    }

    private format(type: string, color?: string): string {
        var freeSpace = Logger.symbolsCount - type.length;

        var type = `${type}${Array(freeSpace).join(" ")}`;

        if (!color) {
            return `${this.time} [${type}] `;
        }
        return `${Logger.timeColor}${this.time} \u001b[22m${color}[${type}]\u001b[37m `;
    }

    private write(message: string, type: string, color: string): void {
        const baseMessage: string = this.format(type) + message;
        const formattedMessage: string = this.format(type, color) + message;

        this.outputChannel.appendLine(baseMessage);
        console.log(formattedMessage)
    }

    public static get instance(): Logger {
        return this._instance || (this._instance = new this());
    }

    public debug(message: string, ...args: any[]): void {
        if (this.level <= LoggerLevel.debug) {
            this.write(message, "debug", Logger.debugColor);
        }
    }

    public info(message: string, ...args: any[]): void {
        if (this.level <= LoggerLevel.info) {
            this.write(message, "info", Logger.infoColor);
        }
    }

    public warn(message: string, ...args: any[]): void {
        if (this.level <= LoggerLevel.warn) {
            this.write(message, "warning", Logger.warnColor);
        }
    }

    public error(message: string, ...args: any[]): void {
        if (this.level <= LoggerLevel.error) {
            this.write(message, "error", Logger.errorColor);
        }
    }

    public suite(message: string, ...args: any[]): void {
        if (this.level <= LoggerLevel.tests) {
            this.write(message, "suite", Logger.infoColor);
        }
    }

    public success(message: string, ...args: any[]): void {
        if (this.level <= LoggerLevel.tests) {
            this.write(message, "success", Logger.successColor);
        }
    }

    public fail(message: string, ...args: any[]): void {
        if (this.level <= LoggerLevel.tests) {
            this.write(message, "fail", Logger.failColor);
        }
    }

    public setLevel(level: LoggerLevel) {
        this.level = level;
    }
}




