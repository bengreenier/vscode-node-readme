import * as assert from 'assert'
import * as vscode from 'vscode'
import {importParser} from '../parsers/import'
import {requireParser} from '../parsers/require'

suite('Parsers', () => {
    test('should parse import calls', () => {
        assert.equal(importParser('import lib from "lib";', 18), 'lib')
        assert.equal(importParser('import pie from "lib";', 18), 'lib')
        assert.equal(importParser('import lib from "lib"', 18), 'lib')
        assert.equal(importParser('import * as lib from "lib"', 23), 'lib')
        assert.equal(importParser('import {lib} from "lib"', 20), 'lib')
        assert.equal(importParser('import {lib as lib} from "lib"', 27), 'lib')
        assert.equal(importParser('import {pie as apple} from "lib"', 29), 'lib')
        assert.equal(importParser('', 0), undefined)
        assert.equal(importParser('           ', 5), undefined)
    })

    test('should parse require calls', () => {
        assert.equal(requireParser('const abc = require("abc");', 22), 'abc')
        assert.equal(requireParser('const abc = require("abc")', 22), 'abc')
        assert.equal(requireParser('const abc = require(\'abc\');', 22), 'abc')
        assert.equal(requireParser('let abc = require("abc");', 20), 'abc')
        assert.equal(requireParser('var abc = require("abc");', 20), 'abc')
        assert.equal(requireParser('const abc = require("abc"); const bcd = require("bcd");', 22), 'abc')
        assert.equal(requireParser('const abc = require("abc"); const bcd = require("bcd");', 50), 'bcd')
        assert.equal(requireParser('const abc = require("abc");', 1), undefined)
        assert.equal(requireParser('const abc = require("abc");', 50), undefined)
        assert.equal(requireParser('', 0), undefined)
        assert.equal(requireParser('           ', 5), undefined)
    })
})