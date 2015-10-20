var parser = require('..');
var describe = require('mocha').describe;
var it = require('mocha').it;
var expect = require('chai').expect;
var path = require('path');
var fs = require('fs');
var html = fs.readFileSync(path.resolve(__dirname, 'templates/render.html'), 'utf8').toString();
var tree = require('./templates/parser.js');

describe('PostHTML-Parser test', function() {
    it('html to tree', function() {
        expect(tree).to.eql(parser(html));
    });
});
