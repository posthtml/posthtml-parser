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

export type NodeText = { text: string | number };
export type NodeTag = {
  tag?: Tag;
  attrs?: Attributes;
  content?: Content;
  location?: SourceLocation;
};

export type Node = (NodeText | NodeTag) & { parent?: NodeTag | Node[] };

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

  function bufferArrayLast(): Node {
    return bufArray[bufArray.length - 1];
  }

  function appendChild(parent: NodeTag | Node[], child: Node) {
    child.parent = parent;

    if (Array.isArray(parent)) {
      parent.push(child);
      return;
    }

    if (!Array.isArray(parent.content)) {
      parent.content = [];
    }

    parent.content.push(child);
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
          appendChild(results, { text: directiveText });
          return;
        }

        if ((typeof last === 'object') && !('text' in last)) {
          if (last.content === undefined) {
            last.content = [];
          }

          if (Array.isArray(last.content)) {
            appendChild(last, { text: directiveText });
          }
        }
      }
    }
  }

  function oncomment(data: string) {
    const last = bufferArrayLast();
    const comment = `<!--${data}-->`;

    if (last === undefined) {
      appendChild(results, { text: comment });
      return;
    }

    if ((typeof last === 'object') && !('text' in last)) {
      if (last.content === undefined) {
        last.content = [];
      }

      if (Array.isArray(last.content)) {
        appendChild(last, { text: comment });
      }
    }
  }

  function onopentag(tag: string, attrs: Attributes) {
    const start = locationTracker.getPosition(parser.startIndex);
    const buf: NodeTag = { tag };

    if (options.sourceLocations) {
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

    if (buf && typeof buf === 'object' && !('text' in buf) &&
        buf.location && parser.endIndex !== null) {
      buf.location.end = locationTracker.getPosition(parser.endIndex);
    }

    if (buf) {
      const last = bufferArrayLast();

      if (bufArray.length <= 0) {
        appendChild(results, buf);
        return;
      }

      if ((typeof last === 'object') && !('text' in last)) {
        if (last.content === undefined) {
          last.content = [];
        }

        if (Array.isArray(last.content)) {
          appendChild(last, buf);
        }
      }
    }
  }

  function ontext(text: string) {
    const last: Node = bufferArrayLast();

    if (last === undefined) {
      appendChild(results, { text });
      return;
    }

    if ((typeof last === 'object') && !('text' in last)) {
      if (last.content && Array.isArray(last.content) && last.content.length > 0) {
        const lastContentNode = last.content[last.content.length - 1];
        if (('text' in lastContentNode) &&
              typeof lastContentNode.text === 'string' && !lastContentNode.text.startsWith('<!--')) {
          lastContentNode.text += String(text);
          return;
        }
      }

      if (last.content === undefined) {
        last.content = [];
      }

      if (Array.isArray(last.content)) {
        appendChild(last, { text });
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
