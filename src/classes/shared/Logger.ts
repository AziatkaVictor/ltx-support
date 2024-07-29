import { OutputChannel, window } from "vscode";

export class Logger {
    private static _instance: Logger;
    private outputChannel: OutputChannel;

    private static timeColor: string = "\u001b[2m\u001b[37m";
    private static debugColor: string = "\u001b[36m";
    private static infoColor: string = "\u001b[32m";
    private static warnColor: string = "\u001b[33m";
    private static errorColor: string = "\u001b[31m";

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
        if (!color) {
            return this.time + " [" + type + "] ";
        }
        return Logger.timeColor + this.time + "\u001b[22m " + color + " [" + type + "] \u001b[37m";
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
        this.write(message, "debug", Logger.debugColor);
    }

    public info(message: string, ...args: any[]): void {
        this.write(message, "info", Logger.infoColor);
    }

    public warn(message: string, ...args: any[]): void {
        this.write(message, "warning", Logger.warnColor);
    }

    public error(message: string, ...args: any[]): void {
        this.write(message, "error", Logger.errorColor);
    }
}




