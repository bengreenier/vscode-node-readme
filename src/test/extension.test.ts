import * as assert from 'assert'
import * as fs from 'fs'
import * as vscode from 'vscode'
import { TestHook } from '../extension'
import * as TypeExtensions from '../type-extensions'
import { NpmProvider } from '../providers/npm'
import { LocalProvider } from '../providers/local'
import { RemoteProvider } from '../providers/remote'
import * as testContent from 'vscode-test-content'

describe("Extension Tests", () => {
    beforeEach(async () => {
        TestHook.testMode = true
        TestHook.setHttpImpl((opts : any, cb) => {
            if (opts.url.endsWith('not-a-real-module')) {
                return cb(new Error('no such module'))
            }

            setTimeout(() => {
                if (opts.json) {
                    const moduleName = opts.url.split('/')[3]
                    return cb(null, {
                        statusCode: 200,
                        body: {
                            "dist-tags": {
                                "latest": "1"
                            },
                            "versions": {
                                "1": {
                                    "repository": {
                                        "type": "git",
                                        "url": `git+https://github.com/${moduleName}/${moduleName}.git`                                  
                                    }
                                }
                            }
                        }
                    })
                } else {
                    return cb(null, {
                        statusCode: 200,
                        body: `raw text, but here's the serialized params: ${JSON.stringify(opts)}`
                    })
                }
            }, 500)
        })

        TestHook.clear()
        
        await vscode.workspace.getConfiguration()
            .update(TypeExtensions.overrideConfigurationSection, {})
            .then(() => {}, () => {})
    })

    describe("NPM", () => {
        it('express (no workspace, non-override)', (done) => {
            testContent.setWithSelection('const express = require(\'e^xpress\')')
                .then((editor : vscode.TextEditor) => {
                    return vscode.commands.executeCommand('nodeReadme.showReadme')
                })
                .then(() => {
                    return new Promise((resolve, reject) => {
                        setTimeout(() => resolve(), 5000)
                    })
                })
                .then(() => {
                    const npmModules = TestHook.logData
                        .filter(d => d.startsWith(NpmProvider.SchemaType))
                        .map(d => vscode.Uri.parse(d))
                        .map(u => TypeExtensions.ReadmeUri.from(u))
                        .map(r => r.moduleName)
                    
                    assert.equal(npmModules.length, 1)
                    assert.equal(npmModules[0], 'express')
                })
                .then(done, done)
        }).timeout(30 * 1000)

        it('moment (workspace, non-override)', (done) => {
            vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.parse(`file:${__dirname}/testdata`)).then(() => {
                return vscode.window.showTextDocument(vscode.Uri.file(`${__dirname}/testdata/valid-require.js`))
                    .then((editor) => {
                        editor.selections = [new vscode.Selection(new vscode.Position(1,25), new vscode.Position(1,25))]
                    })
                    .then(() => {
                        return vscode.commands.executeCommand('nodeReadme.showReadme')
                    })
                    .then(() => {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => resolve(), 5000)
                        })
                    })
                    .then(() => {
                        const npmModules = TestHook.logData
                            .filter(d => d.startsWith(NpmProvider.SchemaType))
                            .map(d => vscode.Uri.parse(d))
                            .map(u => TypeExtensions.ReadmeUri.from(u))
                            .map(r => r.moduleName)
                        
                        assert.equal(npmModules.length, 1)
                        assert.equal(npmModules[0], 'moment')
                    })
                    .then(done, done)
            })
        }).timeout(30 * 1000)

        it('not-a-real-module (no workspace, non-override)', (done) => {
            testContent.setWithSelection('const narm = require(\'not-a-rea^l-module\')')
                .then((editor) => {
                    return vscode.commands.executeCommand('nodeReadme.showReadme')
                })
                .then(() => {
                    return new Promise((resolve, reject) => {
                        setTimeout(() => resolve(), 15000)
                    })
                })
                .then(() => {
                    const npmModules = TestHook.logData
                        .filter(d => d.startsWith(NpmProvider.SchemaType))
                    
                    assert.equal(npmModules.length, 0)
                    assert.equal(TestHook.errData.length, 1)
                })
                .then(done, done)
        }).timeout(30 * 1000)

        it('angular (no workspace, override)', (done) => {
            vscode.workspace.getConfiguration()
                .update(TypeExtensions.overrideConfigurationSection, {
                    angular: `https://npmjs.org/package/request`
                })
                .then(() => {
                    return testContent.setWithSelection('const angular = require(\'angula^r\')')
                })
                .then((editor) => {
                    return vscode.commands.executeCommand('nodeReadme.showReadme')
                })
                .then(() => {
                    return new Promise((resolve, reject) => {
                        setTimeout(() => resolve(), 5000)
                    })
                })
                .then(() => {
                    const npmModules = TestHook.logData
                        .filter(d => d.startsWith(NpmProvider.SchemaType))
                    const localModules = TestHook.logData
                        .filter(d => d.startsWith(LocalProvider.SchemaType))
                    const remoteModules = TestHook.logData
                        .filter(d => d.startsWith(RemoteProvider.SchemaType))
                    
                    assert.equal(npmModules.length, 1)
                    assert.equal(localModules.length, 0)
                    assert.equal(remoteModules.length, 0)
                })
                .then(done, done)
        }).timeout(30 * 1000)
    })

    describe('LOCAL', () => {
        it('request (workspace, non-override)', (done) => {
            vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.parse(`file:${__dirname}/testdata`)).then(() => {
                return vscode.window.showTextDocument(vscode.Uri.file(`${__dirname}/testdata/valid-require.js`))
                    .then((editor) => {
                        editor.selections = [new vscode.Selection(new vscode.Position(0,27), new vscode.Position(0,27))]
                    })
                    .then(() => {
                        return vscode.commands.executeCommand('nodeReadme.showReadme')
                    })
                    .then(() => {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => resolve(), 5000)
                        })
                    })
                    .then(() => {
                        const localModules = TestHook.logData
                            .filter(d => d.startsWith(LocalProvider.SchemaType))
                            .map(d => vscode.Uri.parse(d))
                            .map(u => TypeExtensions.ReadmeUri.from(u))
                            .map(r => r.moduleName)
                        
                        assert.equal(localModules.length, 1)
                        assert.equal(localModules[0], 'request')
                    })
                    .then(done, done)
            })
        }).timeout(30 * 1000)

        it('angular (no workspace, override)', (done) => {
            vscode.workspace.getConfiguration()
                .update(TypeExtensions.overrideConfigurationSection, {
                    angular: `file://${__dirname}/testdata/node_modules/request/README.md`
                })
                .then(() => {
                    return testContent.setWithSelection('const angular = require(\'angula^r\')')
                })
                .then((editor) => {
                    return vscode.commands.executeCommand('nodeReadme.showReadme')
                })
                .then(() => {
                    return new Promise((resolve, reject) => {
                        setTimeout(() => resolve(), 5000)
                    })
                })
                .then(() => {
                    const npmModules = TestHook.logData
                        .filter(d => d.startsWith(NpmProvider.SchemaType))
                    const localModules = TestHook.logData
                        .filter(d => d.startsWith(LocalProvider.SchemaType))
                    const remoteModules = TestHook.logData
                        .filter(d => d.startsWith(RemoteProvider.SchemaType))
                    
                    assert.equal(npmModules.length, 0)
                    assert.equal(localModules.length, 1)
                    assert.equal(remoteModules.length, 0)
                })
                .then(done, done)
        }).timeout(30 * 1000)
    })

    describe('REMOTE', () => {
        it('angular (no workspace, override)', (done) => {
            vscode.workspace.getConfiguration()
                .update(TypeExtensions.overrideConfigurationSection, {
                    angular: `https://raw.githubusercontent.com/angular/angular/master/aio/content/guide/ajs-quick-reference.md`
                })
                .then(() => {
                    return testContent.setWithSelection('const angular = require(\'angula^r\')')
                })
                .then((editor) => {
                    return vscode.commands.executeCommand('nodeReadme.showReadme')
                })
                .then(() => {
                    return new Promise((resolve, reject) => {
                        setTimeout(() => resolve(), 5000)
                    })
                })
                .then(() => {
                    const npmModules = TestHook.logData
                        .filter(d => d.startsWith(NpmProvider.SchemaType))
                    const localModules = TestHook.logData
                        .filter(d => d.startsWith(LocalProvider.SchemaType))
                    const remoteModules = TestHook.logData
                        .filter(d => d.startsWith(RemoteProvider.SchemaType))
                    
                    assert.equal(npmModules.length, 0)
                    assert.equal(localModules.length, 0)
                    assert.equal(remoteModules.length, 1)
                })
                .then(done, done)
        }).timeout(30 * 1000)
    })
})