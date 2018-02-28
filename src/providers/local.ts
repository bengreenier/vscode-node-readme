import * as vscode from 'vscode'
import * as fs from 'fs'
import { ReadmeUri } from '../type-extensions'

export class LocalProvider implements vscode.TextDocumentContentProvider {
    public static SchemaType = "node-readme-local-data"
    
    public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken) {
        return this.getReadme(ReadmeUri.from(uri).rawUri.fsPath)
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