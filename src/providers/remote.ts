import * as request from 'request'
import * as vscode from 'vscode'
import * as path from 'path'
import * as backoff from 'backoff'
import { ReadmeUri } from '../type-extensions'
import { TestHook } from '../extension'

export class RemoteProvider implements vscode.TextDocumentContentProvider {
    public static SchemaType = "node-readme-remote-data"
    
    public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken) {
        const rawUri = ReadmeUri.from(uri).rawUri
        const fragSplit = rawUri.fragment.indexOf('.')
        return this.getReadme(rawUri.with({
            scheme: rawUri.fragment.substring(0, fragSplit),
            fragment: rawUri.fragment.substring(fragSplit + 1)
        }).toString()).then((p) => {
            TestHook.log(uri.toString())
            return p
        }, (err) => {
            TestHook.err(err)
            return Promise.reject(err)
        })
    }

    public getReadme(path : string) : PromiseLike<string> {
        const get = (opts, cb) => {
            request(opts, function (err, res, body) {
                if (err || res.statusCode !== 200) {
                    err = err || {}
                    err.status = res.statusCode
                    return cb(err)
                } else {
                    cb(null, res)
                }
            })
        }
        
        return new Promise((resolve, reject) => {
            let call = backoff.call(get, {
                url: path,
                headers: {
                    "User-Agent": "bengreenier/vscode-node-readme"
                }
            }, (err, res) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(res.body)
                }
            })
             
            call.retryIf(function(err) { return err.status !== 200 })
            call.setStrategy(new backoff.ExponentialStrategy())
            call.failAfter(10)

            call.start()
        })
    }
}