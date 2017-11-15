'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import * as request from 'request'
import * as path from 'path'
import * as fs from 'fs'
import * as coreNames from 'node-core-module-names'
import {NpmDataProvider} from './npmdata'
import {LocalDataProvider} from './localdata'
import parsers from './parsers'
import { Uri, workspace } from 'vscode'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context) {
    let commands = [
        vscode.workspace.registerTextDocumentContentProvider(NpmDataProvider.SchemaType, new NpmDataProvider()),
        vscode.workspace.registerTextDocumentContentProvider(LocalDataProvider.SchemaType, new LocalDataProvider()),
        vscode.commands.registerCommand('nodeReadme.showReadme', () => {

            if (vscode.window.activeTextEditor == null) {
                vscode.window.showInputBox({
                    prompt: "Enter Module name"
                })
                .then(findReadme)
            } else {
                const moduleName = scanDocument(vscode.window.activeTextEditor)

                if (moduleName) {
                    findReadme(moduleName, vscode.window.activeTextEditor)
                }
            }
        })
    ]
    context.subscriptions.push(...commands)
}

function scanDocument(textEditor : vscode.TextEditor) {
    const textDocument = textEditor.document
    const langId = textDocument.languageId

    if (langId === 'javascript' ||
        langId === 'typescript' ||
        langId === 'javascriptreact' ||
        langId === 'typescriptreact') {
        let pos = textEditor.selection.start
        let line = textDocument.lineAt(pos.line)

        for (let i = 0; i < parsers.length; i++) {
            let moduleName = parsers[i](line, pos)

            if (moduleName) {
                return moduleName
            }
        }
    }
}

function findReadme(moduleName : string, textEditor ?: vscode.TextEditor) {
    let isMultiRoot = false

    // determine if we're vscode >= 1.18.0 (multiroot)
    if (vscode.workspace.getWorkspaceFolder) {
        isMultiRoot = true
    }

    let localUris = []

    if (textEditor && isMultiRoot) {
        const folder = vscode.workspace.getWorkspaceFolder(textEditor.document.uri)

        // we can search locally @ this path
        localUris = [folder.uri.with({path: path.join(folder.uri.fsPath, "node_modules", moduleName, "readme.md")})]
    } else if (isMultiRoot) {
        // we can search locally @ these paths
        localUris.push(vscode.workspace.workspaceFolders.map(f => f.uri.with({path: path.join(f.uri.fsPath, "node_modules", moduleName, "readme.md")})))
    } else {
        const folder = vscode.Uri.parse(`file://${vscode.workspace.rootPath}`)

        // we can search locally @ this path
        localUris = [folder.with({path: path.join(folder.fsPath, "node_modules", moduleName, "readme.md")})]
    }


    // see if we can find a local readme
    for (let i = 0 ; i < localUris.length ; i++) {
        const uri = localUris[i]

        if (fs.existsSync(uri.fsPath)) {
            // if we found it locally, we good
            //
            // authorities must be stripped, otherwise
            // https://github.com/Microsoft/vscode/blob/87c24f2b2633ae0652caac1f0df9acadb3271f5e/extensions/markdown/src/previewContentProvider.ts#L40
            // throws and breaks all the things
            return vscode.commands.executeCommand("markdown.showPreviewToSide", uri.with({
                scheme: LocalDataProvider.SchemaType,

                // we unpack this in the data provider
                // but this enables us to have the moduleName is the tab title
                path: path.join(uri.path, moduleName)
            }));
        }
    }

    // otherwise, we can use our npmdata component to lookup and display the content
    //
    // authorities must be stripped, otherwise
    // https://github.com/Microsoft/vscode/blob/87c24f2b2633ae0652caac1f0df9acadb3271f5e/extensions/markdown/src/previewContentProvider.ts#L40
    // throws and breaks all the things
    const uri = vscode.Uri.parse(`${NpmDataProvider.SchemaType}://npmjs.org/${moduleName}`).with({
        authority: null
    });

    return vscode.commands.executeCommand("markdown.showPreviewToSide", uri);
}

export function deactivate() {}