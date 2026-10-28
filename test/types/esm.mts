import { parser, type Node, type Options } from "../../dist/index.js";

const options: Options = {
  decodeEntities: true,
  recognizeNoValueAttribute: true,
};
const tree: Node[] = parser("<input disabled>", options);
void tree;

// @ts-expect-error HTML input must be a string.
parser(123);
