const { Parser } = require('htmlparser2');

/**
 * @see https://github.com/fb55/htmlparser2/wiki/Parser-options
 */
const defaultOptions = {lowerCaseTags: false, lowerCaseAttributeNames: false};

const defaultDirectives = [{name: '!doctype', start: '<', end: '>'}];

/**
 * Parse html to PostHTMLTree
 * @param  {String} html
 * @param  {Object} [options=defaultOptions]
 * @return {PostHTMLTree}
 */
function postHTMLParser(html, options) {
    const bufArray = [];
    const results = [];

    bufArray.last = function() {
        return this[this.length - 1];
    };

    function isDirective({name}, tag) {
        if (name instanceof RegExp) {
            const regex = RegExp(name.source, 'i');

            return regex.test(tag);
        }

        if (tag !== name) {
            return false;
        }

        return true;
    }

    function parserDirective(name, data) {
        const directives = [].concat(defaultDirectives, options.directives || []);
        const last = bufArray.last();

        for (let i = 0; i < directives.length; i++) {
            const directive = directives[i];
            const directiveText = directive.start + data + directive.end;

            name = name.toLowerCase();
            if (isDirective(directive, name)) {
                if (!last) {
                    results.push(directiveText);
                    return;
                }

                last.content || (last.content = []);
                last.content.push(directiveText);
            }
        }
    }

    function normalizeArributes(attrs) {
        const result = {};
        Object.keys(attrs).forEach(key => {
            const obj = {};
            obj[key] = attrs[key].replace(/&quot;/g, '"');
            Object.assign(result, obj);
        });

        return result;
    }

    const parser = new Parser({
        onprocessinginstruction: parserDirective,
        oncomment(data) {
            const comment = `<!--${data}-->`;
            const last = bufArray.last();

            if (!last) {
                results.push(comment);
                return;
            }

            last.content || (last.content = []);
            last.content.push(comment);
        },
        onopentag(tag, attrs) {
            const buf = { tag };

            if (Object.keys(attrs).length) {
                buf.attrs = normalizeArributes(attrs);
            }

            bufArray.push(buf);
        },
        onclosetag() {
            const buf = bufArray.pop();

            if (!bufArray.length) {
                results.push(buf);
                return;
            }

            const last = bufArray.last();
            if (!Array.isArray(last.content)) {
                last.content = [];
            }

            last.content.push(buf);
        },
        ontext(text) {
            const last = bufArray.last();

            if (!last) {
                results.push(text);
                return;
            }

            if (last.content?.length && typeof last.content[last.content.length - 1] === 'string') {
                last.content[last.content.length - 1] = last.content[last.content.length - 1] + text
                return
            }


            last.content || (last.content = []);
            last.content.push(text);
        }
    }, options || defaultOptions);

    parser.write(html);
    parser.end();

    return results;
}

function parserWrapper(...args) {
    let option;

    function parser(html) {
        const opt = Object.assign({}, defaultOptions, option);
        return postHTMLParser(html, opt);
    }

    if (
        args.length === 1 &&
        Boolean(args[0]) &&
        args[0].constructor.name === 'Object'
    ) {
        option = args[0];
        return parser;
    }

    option = args[1];
    return parser(args[0]);
}

module.exports = parserWrapper;
module.exports.defaultOptions = defaultOptions;
module.exports.defaultDirectives = defaultDirectives;
