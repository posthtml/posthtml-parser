import { Parser, ParserOptions } from 'htmlparser2';
import { LocationTracker, SourceLocation } from './location-tracker';

export type Directive = {
  name: string | RegExp;
  start: string;
  end: string;
};

export type Options = {
  directives?: Directive[];
  sourceLocations?: boolean;
} & ParserOptions;

export type Tag = string | boolean;
export type Attributes = Record<string, string | number | boolean>;
export type Content = NodeText | Array<Node | Node[]>;

export type NodeText = string | number;
export type NodeTag = {
  tag?: Tag;
  attrs?: Attributes;
  content?: Content;
  location?: SourceLocation;
};

export type Node = NodeText | NodeTag;

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

export const parser = (html: string, options: Options = {}): Node[] => {
  const locationTracker = new LocationTracker(html);
  const bufArray: Node[] = [];
  const results: Node[] = [];
  let lastIndices: [number, number];

  function bufferArrayLast(): Node | undefined {
    return bufArray[bufArray.length - 1];
  }

  function resultsLast(): Node | undefined {
    return results[results.length - 1];
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

      object[key] = String(attrs[key]).replace(/&quot;/g, '"');
      Object.assign(result, object);
    });

    return result;
  }

  function onprocessinginstruction(name: string, data: string) {
    const directives = defaultDirectives.concat(options.directives ?? []);
    const last = bufferArrayLast();

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

          if (Array.isArray(last.content)) {
            last.content.push(directiveText);
          }
        }
      }
    }
  }

  function oncomment(data: string) {
    const last = bufferArrayLast();
    const comment = `<!--${data}-->`;

    if (last === undefined) {
      results.push(comment);
      return;
    }

    if (typeof last === 'object') {
      if (last.content === undefined) {
        last.content = [];
      }

      if (Array.isArray(last.content)) {
        last.content.push(comment);
      }
    }
  }

  function onopentag(tag: string, attrs: Attributes) {
    const buf: NodeTag = { tag };

    if (options.sourceLocations) {
      if (lastIndices?.[0] === parser.startIndex && lastIndices?.[1] === parser.endIndex) {
        // The last closing tag was inferred, so we need to update its end location
        const last = bufferArrayLast() || resultsLast();

        if (typeof last === 'object' && Array.isArray(last.content) && last.location) {
          last.location.end = locationTracker.getPosition(parser.startIndex - 1)
        }
      }

      const start = locationTracker.getPosition(parser.startIndex);

      buf.location = {
        start,
        end: start
      };
    }

    if (Object.keys(attrs).length > 0) {
      buf.attrs = normalizeArributes(attrs);
    }

    bufArray.push(buf);
  }

  function onclosetag() {
    const buf: Node | undefined = bufArray.pop();

    if (buf && typeof buf === 'object' && buf.location && buf.location.end === buf.location.start && parser.endIndex !== null) {
      lastIndices = [parser.startIndex, parser.endIndex];
      buf.location.end = locationTracker.getPosition(parser.endIndex);
    }

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

        if (Array.isArray(last.content)) {
          last.content.push(buf);
        }
      }
    }
  }

  function ontext(text: string) {
    const last = bufferArrayLast();

    if (last === undefined) {
      results.push(text);
      return;
    }

    if (typeof last === 'object') {
      if (last.content && Array.isArray(last.content) && last.content.length > 0) {
        const lastContentNode = last.content[last.content.length - 1];
        if (typeof lastContentNode === 'string' && !lastContentNode.startsWith('<!--')) {
          last.content[last.content.length - 1] = `${lastContentNode}${text}`;
          return;
        }
      }

      if (last.content === undefined) {
        last.content = [];
      }

      if (Array.isArray(last.content)) {
        last.content.push(text);
      }
    }
  }

  const parser = new Parser({
    onprocessinginstruction,
    oncomment,
    onopentag,
    onclosetag,
    ontext
  }, { ...defaultOptions, ...options });

  parser.write(html);
  parser.end();

  return results;
};
