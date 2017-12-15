export = parserWrapper;

interface PostHTMLNode {
    tag: string;
    attrs: { [key: string]: string };
    content: Array<string | PostHTMLNode>
}

declare function parserWrapper(html: string): PostHTMLNode[];

declare namespace parserWrapper {
    export var defaultOptions: {
        lowerCaseTags: boolean;
        lowerCaseAttributeNames: boolean;
    };

    export var defaultDirectives: {
        name: string;
        start: string;
        end: string;
    }[];
}


