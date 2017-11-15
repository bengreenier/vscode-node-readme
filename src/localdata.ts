import * as request from 'request'
import * as vscode from 'vscode'
import * as url from 'url'
import * as fs from 'fs'

export class LocalDataProvider implements vscode.TextDocumentContentProvider {
    public static SchemaType = "npm-local-data"
    
    public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken) {

        const sep = process.platform == 'win32' ? '\\' : '/'

        return this.getReadme(uri.fsPath.substr(0, uri.fsPath.lastIndexOf(sep)))
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