import {ParserOptions} from 'htmlparser2';

declare const parser: (html: string, options?: Options) => Node[];

export default parser;

export type Directive = {
  name: string | RegExp;
  start: string;
  end: string;
};

export type Options = {
  directives?: Directive[];
} & ParserOptions;

export type Tag = string | boolean;
export type Attributes = Record<string, string>;
export type Content = NodeText | Node[];

export type NodeText = string;
export type NodeTag = {
  tag?: Tag;
  attrs?: Attributes;
  content?: Content;
};

export type Node = NodeText | NodeTag;


