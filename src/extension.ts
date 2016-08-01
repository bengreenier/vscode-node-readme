'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context) {

    let disposable = vscode.commands.registerCommand('nodeReadme.showReadme', () => {
        let e = vscode.window.activeTextEditor;
        let d = e.document;

        if (d.languageId !== "javascript") {
            return vscode.window.showErrorMessage("Javascript file not selected");
        }

        let pos = e.selection.start;
        let line = d.lineAt(pos.line);

        // figure out what module we want
        let moduleName;
        let re = /require\(['"]([^'"]+)['"](?:, ['"]([^'"]+)['"])?\);?/g;
        let str = line.text;
        let matched;
        while ((matched = re.exec(str)) != null) {
            if (matched.index <= pos.character && pos.character <= re.lastIndex) {
                moduleName = matched[1];
                break;
            }
        }

        // the following optionally depends on input so we promise-ify it
        let thenable : PromiseLike<string>;

        if (!moduleName) {
            thenable = vscode.window.showInputBox({
                prompt: "Enter Module name"
            });
        } else {
            thenable = Promise.resolve(moduleName);
        }

        // note that this hides moduleName in the outer scope
        thenable.then((moduleName) => {
            
            // then we proceed with lookup
            let currentUri = d.uri;
            let dirPath = path.dirname(currentUri.fsPath);
            let readmePath = path.join("node_modules", moduleName, "README.md");
            let readmeUri;
            let exists;

            do {
                readmeUri = vscode.Uri.file(path.join(dirPath, readmePath));
                dirPath = path.join(dirPath, "../");
            } while (!(exists = fs.existsSync(readmeUri.fsPath)) && dirPath !== path.join(dirPath, "../"))

            if (exists) {
                return vscode.commands.executeCommand("markdown.showPreviewToSide", readmeUri);
            } else {
                return vscode.window.showErrorMessage(`Module ${moduleName} is not installed locally.`);
            }
        });
    });
    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}