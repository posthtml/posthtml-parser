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

    it('should be parse comment', function() {
        expect(parser('<!--comment-->')).to.eql(['<!--comment-->']);
    });

    it('should be parse comment in content', function() {
        expect(parser('<div><!--comment--></div>')).to.eql([{tag: 'div', content: ['<!--comment-->']}]);
    });

    it('should be parse doctype', function() {
        expect(parser('<!doctype html>')).to.eql(['<!doctype html>']);
    });

    it('should be parse tag', function() {
        expect(parser('<html></html>')).to.eql([{ tag: 'html' }]);
    });

    it('should be parse doctype and tag', function() {
        expect(parser('<!doctype html><html></html>')).to.eql(['<!doctype html>', { tag: 'html' }]);
    });

    it('should be parse tag attrs', function() {
        expect(parser('<div id="id" class="class"></div>')).to.eql([{
            tag: 'div', attrs: { id: 'id', class: 'class'} }
        ]);
    });

    it('should be parse text', function() {
        expect(parser('Text')).to.eql(['Text']);
    });

    it('should be parse text in content', function() {
        expect(parser('<div>Text</div>')).to.eql([{ tag: 'div', content: ['Text'] }]);
    });
});
