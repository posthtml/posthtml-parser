'use strict'

const parser = require('./parser')

module.exports = function (options) {
  options = Object.assign(
    { lowerCaseTags: false, lowerCaseAttributeNames: false },
    options
  )

  return function (html) {
    return parser(html, options)
  }
}
