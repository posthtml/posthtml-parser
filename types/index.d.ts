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
  sourceLocations?: boolean;
} & ParserOptions;

export type Node = NodeText | NodeTag;
export type NodeText = string;
export type NodeTag = {
  tag?: string | boolean;
  attrs?: Attributes;
  content?: Node[];
  loc?: SourceLocation;
};

export type Attributes = Record<string, string>;
export type SourceLocation = {
  start: Position;
  end: Position;
};

export type Position = {
  line: number;
  column: number;
};
