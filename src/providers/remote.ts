import * as request from 'request'
import * as vscode from 'vscode'
import * as path from 'path'
import { ReadmeUri } from '../type-extensions'

export class RemoteProvider implements vscode.TextDocumentContentProvider {
    public static SchemaType = "node-readme-remote-data"
    
    public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken) {
        return this.getReadme(ReadmeUri.from(uri).rawUri.fsPath)
    }

    public getReadme(path : string) : PromiseLike<string> {
        return new Promise((resolve, reject) => {
            request({
                url: path,
                headers: {
                    "User-Agent": "bengreenier/vscode-node-readme"
                }
            }, (err, res, body) => {
                if (err) reject(err)
                else resolve(body)
            })
        })
    }
}