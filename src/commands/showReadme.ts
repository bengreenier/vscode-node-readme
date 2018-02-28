import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'
import { importParser } from '../parsers/import'
import { requireParser } from '../parsers/require'
import { vscodeHelper } from '../parsers/vscode-helper'
import { LocalProvider } from '../providers/local';
import { NpmProvider } from '../providers/npm';
import { ReadmeUri } from '../type-extensions';

export const id = "showReadme"
export function command() {
    let moduleName = vscode.window.activeTextEditor ? scanDocument(vscode.window.activeTextEditor) : null;

    if (moduleName == null) {
        vscode.window.showInputBox({
            prompt: "Enter Module name"
        })
        .then(findReadme)
    } else {
        findReadme(moduleName)
    }
}

function scanDocument(textEditor : vscode.TextEditor) {
    const textDocument = textEditor.document

    let pos = textEditor.selection.start
    let line = textDocument.lineAt(pos.line)
    let parsers = [requireParser, importParser]

    for (let i = 0 ; i < parsers.length; i++) {
        const moduleName = vscodeHelper(line, pos, parsers[i])

        if (moduleName) return moduleName
    }

    return null
}

function findReadme(moduleName : string, textEditor ?: vscode.TextEditor) {
    textEditor = textEditor || vscode.window.activeTextEditor

    if (!textEditor.document) {
        throw new Error('No open document')
    }

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(textEditor.document.uri)

    // TODO(bengreenier): support multiple readme file names (on *nix this may be ReAdMe.Md for example)
    let readmeLocation = workspaceFolder.uri.with({path: path.join(workspaceFolder.uri.fsPath, "node_modules", moduleName, "README.md")})

    // see if we have an override for it
    const overrides = vscode.workspace.getConfiguration("nodeReadme.overrides")

    if (overrides[moduleName]) {
        // if we do, use that
        readmeLocation = vscode.Uri.parse(overrides[moduleName])
    } else {
        // otherwise, check if it's local
        if (fs.existsSync(readmeLocation.fsPath)) {
            // if it is, use local scheme
            readmeLocation = readmeLocation.with({
                scheme: LocalProvider.SchemaType
            })
        } else {
            // if it isn't, use remote scheme
            readmeLocation = readmeLocation.with({
                scheme: NpmProvider.SchemaType
            })
        }
    }

    return vscode.commands.executeCommand('markdown.showPreviewToSide', ReadmeUri.from(readmeLocation, moduleName).toEncodedUri())
}