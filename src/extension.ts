'use strict';
import * as vscode from 'vscode'
import * as request from 'request'
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
    public testMode : Boolean = false
    public logData : Array<string> = []
    public errData : Array<any> = []
    private httpImpl : {(opts : any, cb: {(err : any, res ?: any)})} = (reqOpts, cb) => {
        request(reqOpts, function (err, res, body) {
            if (err || res.statusCode !== 200) {
                err = err || {}
                err.status = res.statusCode
                return cb(err)
            } else {
                cb(null, res)
            }
        })
    }

    log(data : string) {
        if (this.testMode) {
            this.logData.push(data)
        }
    }

    err(data : any) {
        if (this.testMode) {
            this.errData.push(data)
        }
    }

    clear() {
        this.logData = []
    }

    getHttpImpl() {
        return this.httpImpl
    }

    setHttpImpl(impl: {(opts : any, cb: {(err : any, res ?: any)})}) {
        if (this.testMode) {
            this.httpImpl = impl
        }
    }
}

export const TestHook = new TestHookManager()
