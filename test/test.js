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
        expect(parser(html)).to.eql(tree);
    });

    it('comment', function() {
        expect(parser('<div><!--comment--></div>')).to.eql([{tag: 'div', content: ['<!--comment-->']}]);
    });

    it('last comment', function() {
        expect(parser('<!--comment-->')).to.eql(['<!--comment-->']);
    });
});
