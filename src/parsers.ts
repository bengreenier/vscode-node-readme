export default [
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