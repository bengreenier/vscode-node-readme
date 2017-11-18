import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

export class LocalDataProvider implements vscode.TextDocumentContentProvider {
    public static SchemaType = "node-readme-local-data"
    
    public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken) {
        return this.getReadme(uri.fsPath.substr(0, uri.fsPath.lastIndexOf(path.sep)))
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