import * as vscode from 'vscode'

/**
 * Represents a wrapped uri containing the module name 
 */
export class ReadmeUri {
    /**
     * We use this for encoding and decoding
     * 
     * using a / allows us to piggypack the markdown previewer behavior of showing the last slug
     * as the current tab title
     */
    public static encodingSeparator : string = "/"

    private _rawUri : vscode.Uri
    private _moduleName : string
    
    /**
     * Creates an instance from an encoded uri @see toEncodedUri()
     * @param uri the encoded uri to parse from
     */
    static from(uri : vscode.Uri) : ReadmeUri
    
    /**
     * Creates an instance from a uri and a module name
     * @param uri the uri to include
     * @param moduleName the module name to include 
     */
    static from(uri : vscode.Uri, moduleName ?: string) : ReadmeUri {
        // if we're using the method as described above
        if (moduleName) {
            return new ReadmeUri(uri, moduleName)
            
        // if we're using the method overload
        } else {
            const moduleName = uri.path.substr(uri.path.lastIndexOf(ReadmeUri.encodingSeparator) + 1)
            const decodedUri = uri.with({
                path: uri.path.substr(0, uri.path.lastIndexOf(ReadmeUri.encodingSeparator))
            })

            return new ReadmeUri(decodedUri, moduleName)
        }
    }

    /**
     * Creates an instance given it's components
     * @param rawUri a raw uri
     * @param moduleName a module name
     */
    private constructor(rawUri : vscode.Uri, moduleName : string) {
        this._rawUri = rawUri
        this._moduleName = moduleName
    }

    /**
     * Encodes a module name and uri together
     * @returns {Uri} encoded uri
     */
    toEncodedUri() : vscode.Uri {
        return this._rawUri.with({
            path: `${this._rawUri.path}${ReadmeUri.encodingSeparator}${this._moduleName}`
        })
    }

    /**
     * @returns {Uri} the underlying uri
     */
    get rawUri() {
        return this._rawUri
    }

    /**
     * @returns {string} the underlying module name
     */
    get moduleName() {
        return this._moduleName
    }
}

/**
 * Represents the name of a module
 */
export class ModuleName {
    /**
     * We use this for content parsing
     * 
     * using an array of parsers lets us support different module import syntaxes easily
     * note: these will be checked in order, and the first match will be used
     */
    public static LineParsers : ((line : vscode.TextLine, pos : vscode.Position) => string)[] = [
        /**
         * Parser for const lib = require('lib')
         */
        (line, pos) => {
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

            return moduleName;
        },
        /**
         * Parser for import lib from 'lib'
         * Parser for import * as lib from 'lib'
         * Parser for import {lib} from 'lib'
         * Parser for import {lib as lib} from 'lib'
         */
        (line, pos) => {
            let moduleName;

            let re = /import .*?from\s|("|')(.*?)("|')/g;
            let str = line.text;
            let matched;
            while ((matched = re.exec(str)) != null) {
                if (matched.index <= pos.character && pos.character <= re.lastIndex) {
                    moduleName = matched[2];
                    break;
                }
            }

            return moduleName;
        }
    ]

    private _name : string

    /**
     * Tries to create an instance from a text editor with content currently selected
     * @param textEditor the regular uri
     * @returns {null|ModuleName} null or an instance
     */
    static from(textEditor : vscode.TextEditor) : ModuleName {
        const editorPosition = textEditor.selection.start
        const editorLine = textEditor.document.lineAt(editorPosition)

        let moduleName
        for (let i = 0 ; i < ModuleName.LineParsers.length ; i++) {
            const lineParser = ModuleName.LineParsers[i]
            
            if (moduleName = lineParser(editorLine, editorPosition)) {
                break
            }
        }

        return moduleName ? new ModuleName(moduleName) : null
    }

    /**
     * Creates an instance given the module name
     * @param moduleName the underlying module name
     */
    private constructor(moduleName : string) {
        this._name = moduleName
    }

    /**
     * @returns {string} the module name
     */
    get name() {
        return this._name
    }
}

export class ModuleLocation {
    
    /**
     * We use this for location determination
     * 
     * using an array of finders lets us support different locations easily
     * note: these will be checked in order, and the first match will be used
     */
    public static NameFinders : ((name : string) => string)[] = [
        /**
         * Finder for workspace local node_module readmes
         */
        (name) => {
            
        },
        /**
         * Finder for npm modules
         */
        (name) => {
            return "node-readme-npm-data"
        }
    ]

    private _schema : string
    
    /**
     * Tries to create an instance from a module name
     * @param moduleName the module name
     * @returns {null|ModuleLocation} null or an instance
     */
    static from(moduleName : ModuleName) : ModuleLocation {
        const rawName = moduleName.name

        let schemaType
        for (let i = 0 ; i < ModuleLocation.NameFinders.length ; i++) {
            const nameFinder = ModuleLocation.NameFinders[i]
            
            if (schemaType = nameFinder(rawName)) {
                break
            }
        }

        return schemaType ? new ModuleLocation(schemaType) : null
    }

    /**
     * Creates an instance given the module name
     * @param schema the underlying location schema name
     */
    private constructor(schema : string) {
        this._schema = schema
    }
}