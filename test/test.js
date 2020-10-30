const parser = require('..');
const parserWithMockedDeps = require('rewire')('..');
const {describe} = require('mocha');
const {it} = require('mocha');
const {beforeEach} = require('mocha');
const chai = require('chai');
const sinon = require('sinon');
const {expect} = chai;
chai.use(require('sinon-chai'));

describe('PostHTML-Parser test', () => {
  describe('Call signatures', () => {
    const customOptions = {lowerCaseTags: false, lowerCaseAttributeNames: false};
    let MockedHtmlParser2;
    let parserSpy;

    beforeEach(() => {
      MockedHtmlParser2 = function () {
      };

      MockedHtmlParser2.prototype = {
        write() {
        },
        end() {
        }
      };

      // Create spy on mocked htmlparser2 to collect call stats
      parserSpy = sinon.spy(MockedHtmlParser2);

      // Replace real htmlparser2 dependency of posthtml-parser with mocked
      parserWithMockedDeps.__set__({
        Parser: parserSpy
      });
    });

    it('should use default options when called with 1 param', () => {
      parserWithMockedDeps('');
      expect(parserSpy.firstCall.args[1]).to.eql(customOptions);
    });

    it('should use custom options when called with 2 params', () => {
      parserWithMockedDeps('', customOptions);
      expect(parserSpy.firstCall.args[1]).to.eql(customOptions);
    });

    it('should use custom params when called as factory function', () => {
      const factory = parserWithMockedDeps(customOptions);
      expect(factory).to.be.a('function');
      expect(factory('')).to.be.an('array');
      expect(parserSpy.firstCall.args[1]).to.eql(customOptions);
    });
  });

  it('should be parse doctype in uppercase', () => {
    expect(parser('<!DOCTYPE html>')).to.eql(['<!DOCTYPE html>']);
  });

  it('should be parse comment', () => {
    expect(parser('<!--comment-->')).to.eql(['<!--comment-->']);
  });

  it('should be parse CDATA', () => {
    expect(parser('<script><![CDATA[console.log(1);]]></script>', {xmlMode: true}))
      .to.eql([{tag: 'script', content: ['console.log(1);']}]);
  });

  it('should be parse tag with escape object in attribute', () => {
    const htmlString = '<button data-bem="{&quot;button&quot;:{&quot;checkedView&quot;:&quot;extra&quot;}}"' +
      ' type="submit"></button>';
    const tree = [
      {
        tag: 'button',
        attrs: {
          type: 'submit',
          'data-bem': '{"button":{"checkedView":"extra"}}'
        }
      }
    ];

    expect(parser(htmlString)).to.eql(tree);
  });

  it.skip('should be parse tag with object in attribute data witchout escape', () => {
    const htmlString = '<button data-bem="{"button":{"checkedView":"extra"}}"' +
      ' type="submit"></button>';
    // Console.log(htmlString);
    const tree = [
      {
        tag: 'button',
        attrs: {
          type: 'submit',
          'data-bem': '{"button":{"checkedView":"extra"}}'
        }
      }
    ];

    expect(parser(htmlString)).to.eql(tree);
  });

  it.skip('should be parse tag with object in attribute data escape', () => {
    const json = JSON.stringify({button: {checkedView: 'extra'}});
    const htmlString = '<button data-bem="' + json + '"' +
      ' type="submit"></button>';
    // Console.log(htmlString);
    const tree = [
      {
        tag: 'button',
        attrs: {
          type: 'submit',
          'data-bem': '{"button":{"checkedView":"extra"}}'
        }
      }
    ];

    expect(parser(htmlString)).to.eql(tree);
  });

  it('should be parse comment in content', () => {
    expect(parser('<div><!--comment--></div>')).to.eql([{tag: 'div', content: ['<!--comment-->']}]);
  });

  it('should be parse doctype', () => {
    expect(parser('<!doctype html>')).to.eql(['<!doctype html>']);
  });

  it('should be parse directive', () => {
    const options = {
      directives: [
        {name: '?php', start: '<', end: '>'}
      ]
    };

    expect(parser('<?php echo "Hello word"; ?>', options)).to.eql(['<?php echo "Hello word"; ?>']);
  });

  it('should be parse regular expression directive', () => {
    const options = {
      directives: [
        {name: /\?(php|=).*/, start: '<', end: '>'}
      ]
    };

    expect(parser('<?php echo "Hello word"; ?>', options)).to.eql(['<?php echo "Hello word"; ?>']);
    expect(parser('<?="Hello word"?>', options)).to.eql(['<?="Hello word"?>']);
  });

  it('should be parse directives and tag', () => {
    const options = {
      directives: [
        {name: '!doctype', start: '<', end: '>'},
        {name: '?php', start: '<', end: '>'}
      ]
    };

    const html = '<!doctype html><header><?php echo "Hello word"; ?></header><body>{{%njk test %}}</body>';
    const tree = [
      '<!doctype html>',
      {
        content: ['<?php echo "Hello word"; ?>'],
        tag: 'header'
      },
      {
        content: ['{{%njk test %}}'],
        tag: 'body'
      }
    ];

    expect(parser(html, options)).to.eql(tree);
  });

  it('should be parse tag', () => {
    expect(parser('<html></html>')).to.eql([{tag: 'html'}]);
  });

  it('should be parse doctype and tag', () => {
    expect(parser('<!doctype html><html></html>')).to.eql(['<!doctype html>', {tag: 'html'}]);
  });

  it('should be parse tag attrs', () => {
    expect(parser('<div id="id" class="class"></div>')).to.eql([{
      tag: 'div', attrs: {id: 'id', class: 'class'}
    }]);
  });

  it('should be parse text', () => {
    expect(parser('Text')).to.eql(['Text']);
  });

  it('should be parse text in content', () => {
    expect(parser('<div>Text</div>')).to.eql([{tag: 'div', content: ['Text']}]);
  });

  it('should be parse not a single node in tree', () => {
    expect(parser('<span>Text1</span><span>Text2</span>Text3')).to.eql([
      {tag: 'span', content: ['Text1']}, {tag: 'span', content: ['Text2']}, 'Text3'
    ]);
  });

  it('should be parse not a single node in parent content', () => {
    expect(parser('<div><span>Text1</span><span>Text2</span>Text3</div>')).to.eql([
      {tag: 'div', content: [{tag: 'span', content: ['Text1']}, {tag: 'span', content: ['Text2']}, 'Text3']}
    ]);
  });

  it('should be parse camelCase tag name', () => {
    expect(parser('<mySuperTag></mySuperTag>')).to.eql([
      {tag: 'mySuperTag'}
    ]);
  });

  it('should be parse simple contents are split with "<" in comment', () => {
    const html = '<a> /* width < 800px */ <hr /> test</a>';
    expect(parser(html)).to.eql([
      {tag: 'a', content: [' /* width < 800px */ ', {tag: 'hr'}, ' test']}
    ]);
  });

  it('should be parse style contents are split with "<" in comment', () => {
    const html = '<style> /* width < 800px */ @media (max-width: 800px) { /* selectors */} </style>';
    expect(parser(html)).to.eql([
      {tag: 'style', content: [' /* width < 800px */ @media (max-width: 800px) { /* selectors */} ']}
    ]);
  });

  it('should be parse script contents are split with "<" in comment', () => {
    const html = '<script> var str = \'hey <form\'; if (!str.match(new RegExp(\'<(form|iframe)\', \'g\'))) { /* ... */ }</script>';
    expect(parser(html)).to.eql([
      {tag: 'script', content: [' var str = \'hey <form\'; if (!str.match(new RegExp(\'<(form|iframe)\', \'g\'))) { /* ... */ }']}
    ]);
  });

  it('should be not converting html entity name', () => {
    const html = '&zwnj;&nbsp;&copy;';
    expect(parser(html)).to.eql(['&zwnj;&nbsp;&copy;']);
  });
});
