import * as assert from 'assert'
import * as fs from 'fs'
import * as vscode from 'vscode'
import * as myExtension from '../extension'
import * as TypeExtensions from '../type-extensions'
import * as testContent from 'vscode-test-content'

suite("Extension Tests", () => {
    
    test('test', (done) => {
        testContent.setWithSelection('const express = require(\'e^xpress\')')
            .then((editor) => {
                return vscode.commands.executeCommand('nodeReadme.showReadme')
            })
            .then(() => {
                console.log(vscode.window.visibleTextEditors.map(e => e.document.fileName))
            })
            .then(done, done)
    })

    test("require presents valid local readme", (done) => {
        vscode.workspace.findFiles('testdata/valid-require.js')
            .then((files) => {
                return files[0]
            })
            .then(vscode.workspace.openTextDocument)
            .then((doc) => {
                vscode.window.activeTextEditor.selection = new vscode.Selection(new vscode.Position(0, 28), new vscode.Position(0, 28)) 

                return vscode.commands.executeCommand('nodeReadme.showReadme')
            })
            .then(() => {
                return vscode.window.visibleTextEditors.filter(e => e.document.fileName === 'request')[0].document.getText()
            })
            .then((readmeText) => {
                assert.equal(readmeText, fs.readFileSync('./testdata/node_modules/request/README.md').toString())
            })
            .then(done, done)
    })
})