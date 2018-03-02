'use strict';
import * as vscode from 'vscode'
import { LocalProvider } from './providers/local'
import { NpmProvider } from './providers/npm'
import { RemoteProvider } from './providers/remote'
import * as ShowReadme from './commands/showReadme'

const commandPrefix = "nodeReadme"

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(...[
        vscode.workspace.registerTextDocumentContentProvider(NpmProvider.SchemaType, new NpmProvider()),
        vscode.workspace.registerTextDocumentContentProvider(LocalProvider.SchemaType, new LocalProvider()),
        vscode.workspace.registerTextDocumentContentProvider(RemoteProvider.SchemaType, new RemoteProvider()),
        vscode.commands.registerCommand(`${commandPrefix}.${ShowReadme.id}`, ShowReadme.command)
    ])
}

export function deactivate() {
}

class TestHookManager {
    testMode : Boolean = false
    logData : Array<string> = []
    errData : Array<string> = []

    log(data : string) {
        if (this.testMode) {
            this.logData.push(data)
        }
    }

    err(data : string) {
        if (this.testMode) {
            this.errData.push(data)
        }
    }

    clear() {
        this.logData = []
    }
}

export const TestHook = new TestHookManager()
