/**
 * Parser for const lib = require('lib')
 */
export function requireParser(text : string, pos : number) {
    let moduleName;

    let re = /require\(['"]([^'"]+)['"](?:, ['"]([^'"]+)['"])?\);?/g;
    let str = text;
    let matched;
    while ((matched = re.exec(str)) != null) {
        if (matched.index <= pos && pos <= re.lastIndex) {
            moduleName = matched[1];
            break;
        }
    }

    return moduleName;
}