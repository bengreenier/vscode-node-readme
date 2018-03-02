import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'
import { importParser } from '../parsers/import'
import { requireParser } from '../parsers/require'
import { vscodeHelper } from '../parsers/vscode-helper'
import { LocalProvider } from '../providers/local'
import { NpmProvider } from '../providers/npm'
import { RemoteProvider } from '../providers/remote'
import { TestHook } from '../extension'
import { ReadmeUri, overrideConfigurationSection } from '../type-extensions'

export const id = "showReadme"
export function command() {
    let moduleName = vscode.window.activeTextEditor ? scanDocument(vscode.window.activeTextEditor) : null

    if (moduleName == null) {
        vscode.window.showInputBox({
            prompt: "Enter Module name"
        })
        .then(findReadme)
    } else if (vscode.window.activeTextEditor &&
        vscode.window.activeTextEditor.document &&
        (
            // testMode bypasses these checks... *sigh*
            TestHook.testMode ||
            vscode.window.activeTextEditor.document.languageId === 'javascript' ||
            vscode.window.activeTextEditor.document.languageId === 'typescript' ||
            vscode.window.activeTextEditor.document.languageId === 'javascriptreact' || 
            vscode.window.activeTextEditor.document.languageId === 'typescriptreact'
        )) {
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
    let readmeLocation = vscode.Uri.parse(`https://npmjs.org/package/${moduleName}`)

    if (workspaceFolder) {
        const fsLocation = workspaceFolder.uri.with({path: path.join(workspaceFolder.uri.fsPath, "node_modules", moduleName, "README.md")})

        if (fs.existsSync(fsLocation.fsPath)) {
            readmeLocation = fsLocation.with({
                scheme: 'file'
            })
        }
    }

    // see if we have an override for it
    const overrides = vscode.workspace.getConfiguration(overrideConfigurationSection)

    if (overrides[moduleName]) {
        // if we do, use that
        readmeLocation = vscode.Uri.parse(overrides[moduleName])
    }

    // map schemes to our scheme types
    if (readmeLocation.scheme === 'file') {
        readmeLocation = readmeLocation.with({
            scheme: LocalProvider.SchemaType
        })
    } else if (readmeLocation.authority === 'npmjs.org') {
        readmeLocation = readmeLocation.with({
            scheme: NpmProvider.SchemaType
        })
    } else {
        readmeLocation = readmeLocation.with({
            scheme: RemoteProvider.SchemaType,
            fragment: `${readmeLocation.scheme}.${readmeLocation.fragment}`
        })
    }

    return vscode.commands.executeCommand('markdown.showPreviewToSide', ReadmeUri.from(readmeLocation, moduleName).toEncodedUri())
}