export = parserWrapper;

interface PostHTMLAST {
  tag: string;
  attrs: { [key: string]: string };
  content: Array<string | PostHTMLAST>
}

declare function parserWrapper(html: string): PostHTMLAST[];

declare namespace parserWrapper {
  export interface defaultOptions {
    lowerCaseTags: boolean;
    lowerCaseAttributeNames: boolean;
  }

  export type defaultDirectives = {
    name: string;
    start: string;
    end: string;
  }[];
}


