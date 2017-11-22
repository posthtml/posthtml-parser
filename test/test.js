var parser = require('..');
var parserWithMockedDeps = require('rewire')('..');
var describe = require('mocha').describe;
var it = require('mocha').it;
var beforeEach = require('mocha').beforeEach;
var chai = require('chai');
var sinon = require('sinon');
var expect = chai.expect;
chai.use(require('sinon-chai'));

describe('PostHTML-Parser test', function() {
    describe('Call signatures', function() {
        var customOptions = {lowerCaseTags: false, lowerCaseAttributeNames: false};
        var MockedHtmlParser2;
        var parserSpy;

        beforeEach(function() {
            // jscs:disable requireFunctionDeclarations
            MockedHtmlParser2 = function() {};
            MockedHtmlParser2.prototype = {
                write: function() {},
                end: function() {}
            };
            // jscs:enable requireFunctionDeclarations

            // Create spy on mocked htmlparser2 to collect call stats
            parserSpy = sinon.spy(MockedHtmlParser2);

            // Replace real htmlparser2 dependency of posthtml-parser with mocked
            parserWithMockedDeps.__set__({
                htmlparser: {Parser: parserSpy}
            });
        });

        it('should use default options when called with 1 param', function() {
            parserWithMockedDeps('');
            expect(parserSpy.firstCall.args[1]).to.eql(parser.defaultOptions);
        });

        it('should use custom options when called with 2 params', function() {
            parserWithMockedDeps('', customOptions);
            expect(parserSpy.firstCall.args[1]).to.eql(customOptions);
        });

        it('should use custom params when called as factory function', function() {
            var factory = parserWithMockedDeps(customOptions);
            expect(factory).to.be.a('function');
            expect(factory('')).to.be.an('array');
            expect(parserSpy.firstCall.args[1]).to.eql(customOptions);
        });
    });

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

    it('should be parse directive', function() {
        var customDirectives = {directives: [
            {name: '?php', start: '<', end: '>'}
        ]};

        expect(parser('<?php echo "Hello word"; ?>', customDirectives)).to.eql(['<?php echo "Hello word"; ?>']);
    });

    it('should be parse directives and tag', function() {
        var customDirectives = {directives: [
            {name: '!doctype', start: '<', end: '>'},
            {name: '?php', start: '<', end: '>'}
        ]};

        var html = '<!doctype html><html><?php echo \"Hello word\"; ?></html>';
        var tree = [
            '<!doctype html>',
            {
                content: ['<?php echo \"Hello word\"; ?>'],
                tag: 'html'
            }
        ];

        expect(parser(html, customDirectives)).to.eql(tree);
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
