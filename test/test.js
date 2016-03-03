var parser = require('..');
var describe = require('mocha').describe;
var it = require('mocha').it;
var expect = require('chai').expect;

describe('PostHTML-Parser test', function() {
    it('should be parse doctype in uppercase', function() { 
        expect(parser('<!DOCTYPE html>')).to.eql(['<!DOCTYPE html>']); 
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

    it('should be parse not a single node in tree', function() {
        expect(parser('<span>Text1</span><span>Text2</span>Text3')).to.eql([
            { tag: 'span', content: ['Text1']}, { tag: 'span', content: ['Text2']}, 'Text3'
        ]);
    });

    it('should be parse not a single node in parent content', function() {
        expect(parser('<div><span>Text1</span><span>Text2</span>Text3</div>')).to.eql([
            { tag: 'div', content: [{ tag: 'span', content: ['Text1']}, { tag: 'span', content: ['Text2']}, 'Text3'] }
        ]);
    });

    it('should be parse camelCase tag name', function() {
        expect(parser('<mySuperTag></mySuperTag>')).to.eql([
            { tag: 'mySuperTag' }
        ]);
    });
});
