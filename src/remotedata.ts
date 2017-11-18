import * as request from 'request'
import * as vscode from 'vscode'
import * as path from 'path'

export class RemoteDataProvider implements vscode.TextDocumentContentProvider {
    public static SchemaType = "node-readme-remote-data"
    
    public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken) {

        const uriStr = uri.path.toString()

        return this.getReadme(uriStr.substring(1, uriStr.lastIndexOf(path.sep)))
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