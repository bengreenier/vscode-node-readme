import * as request from 'request';
import * as vscode from 'vscode';
import * as url from 'url';
import * as path from 'path';
import * as fs from 'fs';

export class LocalDataProvider implements vscode.TextDocumentContentProvider {
    public static SchemaType = "npm-local-data";
    
    public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken) {
        let moduleName = uri.path.substr(1);
        
        return this.getReadme(moduleName);
    }

    public getReadme(moduleName : string) : PromiseLike<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(path.join(vscode.workspace.rootPath, "node_modules", moduleName, "readme.md"), (err, data) => {
                if (err) {
                    return reject(err);
                } else {
                    resolve(data.toString());
                }
            });
        });
    }
}