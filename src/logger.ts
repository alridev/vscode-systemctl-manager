import * as vscode from 'vscode';

export class Logger {
    private static outputChannel: vscode.OutputChannel;
    private static debugMode: boolean = false;

    static initialize() {
        this.outputChannel = vscode.window.createOutputChannel('Systemctl Manager');
        this.debugMode = vscode.workspace.getConfiguration('systemctlManager').get('enableDebugLogs', false);
    }

    static debug(message: string, data?: any) {
        if (this.debugMode) {
            const timestamp = new Date().toISOString();
            const logMessage = `[DEBUG ${timestamp}] ${message}`;
            if (data) {
                this.outputChannel.appendLine(`${logMessage}\nData: ${JSON.stringify(data, null, 2)}`);
            } else {
                this.outputChannel.appendLine(logMessage);
            }
        }
    }

    static info(message: string, data?: any) {
        const timestamp = new Date().toISOString();
        const logMessage = `[INFO ${timestamp}] ${message}`;
        if (data) {
            this.outputChannel.appendLine(`${logMessage}\nData: ${JSON.stringify(data, null, 2)}`);
        } else {
            this.outputChannel.appendLine(logMessage);
        }
    }

    static error(message: string, error?: any) {
        const timestamp = new Date().toISOString();
        const logMessage = `[ERROR ${timestamp}] ${message}`;
        if (error) {
            this.outputChannel.appendLine(`${logMessage}\nError: ${JSON.stringify(error, null, 2)}`);
        } else {
            this.outputChannel.appendLine(logMessage);
        }
    }

    static show() {
        this.outputChannel.show();
    }
} 