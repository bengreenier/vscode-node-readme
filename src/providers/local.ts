import * as vscode from 'vscode'
import * as fs from 'fs'
import { ReadmeUri } from '../type-extensions'
import { TestHook } from '../extension'

export class LocalProvider implements vscode.TextDocumentContentProvider {
    public static SchemaType = "node-readme-local-data"
    
    public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken) {
        const rawUri = ReadmeUri.from(uri).rawUri
        const authDriveLetter = rawUri.authority ? rawUri.authority + '\\' : ''
        return this.getReadme(`${authDriveLetter}${rawUri.fsPath}`).then((p) => {
            TestHook.log(uri.toString())
            return p
        }, (err) => {
            TestHook.err(err)
            return Promise.reject(err)
        })
    }

    public getReadme(path : string) : PromiseLike<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(path, (err, data) => {
                if (err) {
                    return reject(err)
                } else {
                    resolve(data.toString())
                }
            })
        })
    }
}