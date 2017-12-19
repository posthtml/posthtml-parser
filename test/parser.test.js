'use strict'

const it = require('mocha').it
const expect = require('chai').expect
const describe = require('mocha').describe

const parser = require('../lib')

describe('PostHTML Parser', function () {
  describe('Doctypes', function () {
    it('Doctype (uppercase)', function () {
      const options = {}

      const fixture = '<!DOCTYPE html>'
      const expected = [ '<!DOCTYPE html>' ]

      expect(parser(options)(fixture)).to.eql(expected)
    })

    it('Doctype', function () {
      const options = {}

      const fixture = '<!doctype html>'
      const expected = [ '<!doctype html>' ]

      expect(parser(options)(fixture)).to.eql(expected)
    })
  })

  describe('Comments', function () {
    it('Comment', function () {
      const options = {}

      const fixture = '<!-- Comment -->'
      const expected = [ '<!-- Comment -->' ]

      expect(parser(options)(fixture)).to.eql(expected)
    })

    it('Comment (Content)', function () {
      const options = {}

      const fixture = '<div><!-- Comment --></div>'
      const expected = [
        {
          tag: 'div',
          content: [ '<!-- Comment -->' ]
        }
      ]

      expect(parser(options)(fixture)).to.eql(expected)
    })
  })

  describe('XML', function () {
    it('CDATA', function () {
      const options = { xmlMode: true }

      const fixture = '<script><![CDATA[console.log(1);]]></script>'
      const expected = [
        {
          tag: 'script',
          content: [ 'console.log(1);' ]
        }
      ]

      expect(parser(options)(fixture)).to.eql(expected)
    })
  })

  describe('Directives', function () {
    it('Directive', function () {
      const options = {}

      const fixture = '<?php echo "Hello world"; ?>'
      const expected = [ '<?php echo "Hello world"; ?>' ]

      expect(parser(options)(fixture)).to.eql(expected)
    })

    it('Directive (Content)', function () {
      const options = {}

      const fixture = '<!doctype html><html><?php echo "Hello world"; ?></html>'
      const expected = [
        '<!doctype html>',
        {
          tag: 'html',
          content: [ '<?php echo "Hello world"; ?>' ]
        }
      ]

      expect(parser(options)(fixture)).to.eql(expected)
    })

    it('Directive (Custom)', function () {
      const options = {
        directives: [
          { name: '?=', start: '<', end: '>' }
        ]
      }

      const fixture = '<?= echo "Hello word"; ?>'
      const expected = [ '<?= echo "Hello word"; ?>' ]

      expect(parser(options)(fixture)).to.eql(expected)
    })
  })

  describe('Tags', function () {
    it('Doctype', function () {
      const options = {}

      const fixture = '<!doctype html><html></html>'
      const expected = [
        '<!doctype html>',
        { tag: 'html' }
      ]

      expect(parser(options)(fixture)).to.eql(expected)
    })

    it('Attrs', function () {
      const options = {}

      const fixture = '<div id="id" class="class"></div>'
      const expected = [
        {
          tag: 'div',
          attrs: { id: 'id', class: 'class' }
        }
      ]

      expect(parser(options)(fixture)).to.eql(expected)
    })

    it('Attrs', function () {
      const options = {}

      const fixture = '<div id="id" class="class"></div>'
      const expected = [
        {
          tag: 'div',
          attrs: { id: 'id', class: 'class' }
        }
      ]

      expect(parser(options)(fixture)).to.eql(expected)
    })

    it('selfClosing', function () {
      const options = {}

      const fixture = '<import src="path/to/file.html">'
      const expected = [
        {
          tag: 'import',
          attrs: {
            src: 'path/to/file.html'
          }
        }
      ]

      expect(parser(options)(fixture)).to.eql(expected)
    })
  })

  describe('Content', function () {
    it('Text', function () {
      const options = {}

      const fixture = 'Text'
      const expected = [ 'Text' ]

      expect(parser(options)(fixture)).to.eql(expected)
    })

    it('Text (Content)', function () {
      const options = {}

      const fixture = '<div>Text</div>'
      const expected = [
        {
          tag: 'div',
          content: [ 'Text' ]
        }
      ]

      expect(parser(options)(fixture)).to.eql(expected)
    })
  })

  it('Integration - Tree', function () {
    const options = {}

    const fixture = '<span>Text 1</span><span>Text 2</span>Text 3'
    const expected = [
      {
        tag: 'span',
        content: [ 'Text 1' ]
      },
      {
        tag: 'span',
        content: [ 'Text 2' ]
      },
      'Text 3'
    ]

    expect(parser(options)(fixture)).to.eql(expected)
  })

  it('Integration - Node', function () {
    const options = {}

    const fixture = '<div><span>Text 1</span><span>Text 2</span>Text 3</div>'
    const expected = [
      {
        tag: 'div',
        content: [
          {
            tag: 'span',
            content: [ 'Text 1' ]
          },
          {
            tag: 'span',
            content: [ 'Text 2' ]
          },
          'Text 3'
        ]
      }
    ]

    expect(parser(options)(fixture)).to.eql(expected)
  })
})
