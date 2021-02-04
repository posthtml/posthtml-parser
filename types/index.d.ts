import {ParserOptions} from 'htmlparser2';

export type Directive = {
  name: string | RegExp;
  start: string;
  end: string;
};

export type Options = {
  directives?: Directive[];
} & ParserOptions;

export type Node = NodeText | NodeTag;
export type NodeText = string;
export type NodeTag = {
  tag: string;
  attrs?: Attributes;
  content?: Node[];
};

export type Attributes = Record<string, string>;
