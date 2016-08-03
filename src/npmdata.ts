import * as request from 'request';
import * as vscode from 'vscode';
import * as url from 'url';

export class NpmDataProvider implements vscode.TextDocumentContentProvider {
    public static SchemaType = "npm-data";
    
    public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken) {
        // remove leading / before passing along
        return this.getReadme(uri.path.substr(1));
    }

    public getReadme(moduleName :  string) : PromiseLike<string> {
        return new Promise((resolve, reject) => {
            request({
                url: `https://registry.npmjs.org/${moduleName}`,
                json:true
            }, (err, res, body) => {
                if (err || res.statusCode.toString()[0] !== "2") {
                    return reject(err || `Invalid statusCode ${res.statusCode}`);
                }

                // #8 TODO it's probably better to read your package.json first and only default to latest
                if (!body["dist-tags"] || !body["dist-tags"]["latest"]) {
                    return reject(new Error("Invalid registry response"));
                }

                var latestVer = body["dist-tags"]["latest"];

                if (!body["versions"] || !body["versions"][latestVer]) {
                    return reject(new Error("Missing registry response data"));
                }
                if (!body["versions"]["respository"] || !body["versions"][latestVer]["respository"]["url"]) {
                    return reject(new Error("Missing registry repository data"));
                }

                let parsed = url.parse(body["versions"][latestVer]["repository"]["url"]);
                parsed.protocol = "https";
                parsed.pathname = parsed.pathname.replace(/.git$/, "");

                request(`${url.format(parsed)}/raw/master/README.md`, (err, res, body) => {
                    if (err || res.statusCode.toString()[0] !== "2") {
                        return reject(err || `Invalid statusCode ${res.statusCode}`);
                    }
                    resolve(body.toString());
                });
            });
        });
    }
}