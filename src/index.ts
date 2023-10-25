import { Parser, ParserOptions } from "htmlparser2";
import { LocationTracker, SourceLocation } from "./location-tracker";

export type Directive = {
  name: string | RegExp;
  start: string;
  end: string;
};

export type Options = {
  directives?: Directive[];
  sourceLocations?: boolean;
  recognizeNoValueAttribute?: boolean;
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
  decodeEntities: false,
};

const defaultDirectives: Directive[] = [
  {
    name: "!doctype",
    start: "<",
    end: ">",
  },
];

export const parser = (html: string, options: Options = {}): Node[] => {
  const locationTracker = new LocationTracker(html);
  const bufArray: Node[] = [];
  const results: Node[] = [];
  let lastOpenTagEndIndex = 0;
  let noValueAttributes: Record<string, true> = {};

  function bufferArrayLast(): Node {
    return bufArray[bufArray.length - 1];
  }

  function isDirective(directive: Directive, tag: string): boolean {
    if (directive.name instanceof RegExp) {
      const regex = new RegExp(directive.name.source, "i");

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

      if (options.recognizeNoValueAttribute && noValueAttributes[key]) {
        object[key] = true;
      }

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

        if (typeof last === "object") {
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

    if (typeof last === "object") {
      if (last.content === undefined) {
        last.content = [];
      }

      if (Array.isArray(last.content)) {
        last.content.push(comment);
      }
    }
  }

  function onattribute(name: string, value: string, quote?: string | undefined | null) {
    // Quote: Quotes used around the attribute.
    // `null` if the attribute has no quotes around the value,
    // `undefined` if the attribute has no value.
    if (quote === undefined) {
      // `true` is recognized by posthtml-render as attrubute without value
      // See: https://github.com/posthtml/posthtml-render/blob/master/src/index.ts#L268
      noValueAttributes[name] = true;
    }
  }

  function onopentag(tag: string, attrs: Attributes) {
    const buf: NodeTag = { tag };

    if (options.sourceLocations) {
      buf.location = {
        start: locationTracker.getPosition(parser.startIndex),
        end: locationTracker.getPosition(parser.endIndex),
      };
      lastOpenTagEndIndex = parser.endIndex;
    }

    if (Object.keys(attrs).length > 0) {
      buf.attrs = normalizeArributes(attrs);
    }

    // Always reset after normalizeArributes
    // Reason: onopentag callback will fire after all attrubutes have been processed
    noValueAttributes = {};

    bufArray.push(buf);
  }

  function onclosetag(name: string, isImplied: boolean) {
    const buf: Node | undefined = bufArray.pop();

    if (buf && typeof buf === "object" && buf.location && parser.endIndex !== null) {
      if (!isImplied) {
        buf.location.end = locationTracker.getPosition(parser.endIndex);
      } else if (lastOpenTagEndIndex < parser.startIndex) {
        buf.location.end = locationTracker.getPosition(parser.startIndex - 1);
      }
    }

    if (buf) {
      const last = bufferArrayLast();

      if (bufArray.length <= 0) {
        results.push(buf);
        return;
      }

      if (typeof last === "object") {
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
    const last: Node = bufferArrayLast();

    if (last === undefined) {
      results.push(text);
      return;
    }

    if (typeof last === "object") {
      if (last.content && Array.isArray(last.content) && last.content.length > 0) {
        const lastContentNode = last.content[last.content.length - 1];
        if (typeof lastContentNode === "string" && !lastContentNode.startsWith("<!--")) {
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

  const parser = new Parser(
    {
      onprocessinginstruction,
      oncomment,
      onattribute,
      onopentag,
      onclosetag,
      ontext,
    },
    { ...defaultOptions, ...options },
  );

  parser.write(html);
  parser.end();

  return results;
};
