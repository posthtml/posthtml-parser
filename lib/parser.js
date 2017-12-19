'use strict'

const Parser = require('htmlparser2/lib/Parser')

const DIRECTIVES = [
  { name: '!doctype', start: '<', end: '>' },
  { name: '?php', start: '<', end: '>' }
]
/**
 * Parse HTML to PostHTML Tree
 *
 * @method parser
 *
 * @param  {String} html
 * @param  {Object} options
 *
 * @return {Array}  result
 */
function parser (html, options) {
  const buffer = []

  buffer.last = function () {
    return this[this.length - 1]
  }

  const result = []

  const directives = DIRECTIVES.concat(options.directives || [])

  const parse = new Parser({
    onprocessinginstruction: function (name, data) {
      let last = buffer.last()

      directives.forEach((directive) => {
        const node = directive.start + data + directive.end

        if (name.toLowerCase() === directive.name) {
          if (!last) {
            result.push(node)

            return
          }

          last.content || (last.content = [])
          last.content.push(node)
        }
      })
    },

    oncomment: function (data) {
      const comment = '<!--' + data + '-->'

      const last = buffer.last()

      if (!last) {
        result.push(comment)

        return
      }

      last.content || (last.content = [])
      last.content.push(comment)
    },

    onopentag: function (tag, attrs) {
      const node = {}

      node.tag = tag

      if (attrs && Object.keys(attrs).length > 0) {
        node.attrs = {}

        Object.keys(attrs).forEach((attr) => {
          node.attrs[attr] = attrs[attr]
        })
      }

      buffer.push(node)
    },

    onclosetag: function () {
      const node = buffer.pop()

      if (!buffer.length) {
        // undefined for selfClosing tags
        // since we don't have any contents
        // or an additional closing tag 
        if (node) {
          result.push(node)
        }

        return
      }

      const last = buffer.last()

      if (!Array.isArray(last.content)) {
        last.content = []
      }

      last.content.push(node)
    },

    ontext: function (text) {
      const last = buffer.last()

      if (!last) {
        result.push(text)

        return
      }

      last.content || (last.content = [])
      last.content.push(text)
    }
  }, options)

  parse.write(html)
  parse.end()

  return result
}

module.exports = parser
