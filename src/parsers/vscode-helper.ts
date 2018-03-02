import * as vscode from 'vscode'

/**
 * Calls a given parser from vscode constructs
 * @param line the vscode editor line
 * @param pos the vscode editor position
 * @param parserFn the generic parser to call
 */
export function vscodeHelper(line : vscode.TextLine, pos : vscode.Position, parserFn : (text : string, pos : number ) => string) {
    return parserFn(line.text, pos.character)
}