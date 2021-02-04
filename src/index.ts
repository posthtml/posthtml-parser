import {Parser, ParserOptions} from 'htmlparser2';
import {Directive, Node, Options, Attributes} from '../types';

const defaultOptions: ParserOptions = {
  lowerCaseTags: false,
  lowerCaseAttributeNames: false,
  decodeEntities: false
};

const defaultDirectives: Directive[] = [
  {
    name: '!doctype',
    start: '<',
    end: '>'
  }
];

export default (html: string, options: Options = {}): Node[] => {
  const bufArray: Node[] = [];
  const results: Node[] = [];

  function bufferArrayLast(): Node {
    return bufArray[bufArray.length - 1];
  }

  function isDirective(directive: Directive, tag: string): boolean {
    if (directive.name instanceof RegExp) {
      const regex = new RegExp(directive.name.source, 'i');

      return regex.test(tag);
    }

    if (tag !== directive.name) {
      return false;
    }

    return true;
  }

  function normalizeArributes(attrs: Attributes): Attributes {
    const result: Attributes = {};
    Object.keys(attrs).forEach((key: string) => {
      const object: Attributes = {};

      object[key] = attrs[key].replace(/&quot;/g, '"');
      Object.assign(result, object);
    });

    return result;
  }

  function onprocessinginstruction(name: string, data: string) {
    const directives = defaultDirectives.concat(options.directives ?? []);
    const last: Node = bufferArrayLast();

    for (const directive of directives) {
      const directiveText = directive.start + data + directive.end;

      if (isDirective(directive, name.toLowerCase())) {
        if (last === undefined) {
          results.push(directiveText);
          return;
        }

        if (typeof last === 'object') {
          if (last.content === undefined) {
            last.content = [];
          }

          last.content.push(directiveText);
        }
      }
    }
  }

  function oncomment(data: string) {
    const comment = `<!--${data}-->`;
    const last = bufferArrayLast();

    if (last === undefined) {
      results.push(comment);
      return;
    }

    if (typeof last === 'object') {
      if (last.content === undefined) {
        last.content = [];
      }

      last.content.push(comment);
    }
  }

  function onopentag(tag: string, attrs: Attributes) {
    const buf: Node = {tag};

    if (Object.keys(attrs).length > 0) {
      buf.attrs = normalizeArributes(attrs);
    }

    bufArray.push(buf);
  }

  function onclosetag() {
    const buf: Node | undefined = bufArray.pop();

    if (buf) {
      const last = bufferArrayLast();

      if (bufArray.length <= 0) {
        results.push(buf);
        return;
      }

      if (typeof last === 'object') {
        if (last.content === undefined) {
          last.content = [];
        }

        last.content.push(buf);
      }
    }
  }

  function ontext(text: string) {
    const last: Node = bufferArrayLast();

    if (last === undefined) {
      results.push(text);
      return;
    }

    if (typeof last === 'object') {
      if (last.content && last.content.length > 0) {
        const lastContentNode = last.content[last.content.length - 1];
        if (typeof lastContentNode === 'string') {
          last.content[last.content.length - 1] = `${lastContentNode}${text}`;
          return;
        }
      }

      if (last.content === undefined) {
        last.content = [];
      }

      last.content.push(text);
    }
  }

  const parser = new Parser({
    onprocessinginstruction,
    oncomment,
    onopentag,
    onclosetag,
    ontext
  }, {...defaultOptions, ...options});

  parser.write(html);
  parser.end();

  return results;
};
