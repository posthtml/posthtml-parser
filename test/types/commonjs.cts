import posthtmlParser = require("../..");

const options: posthtmlParser.Options = {
  xmlMode: true,
  sourceLocations: true,
  directives: [{ name: "?xml", start: "<", end: ">" }],
};
const tree: posthtmlParser.Node[] = posthtmlParser.parser("<Root />", options);
void tree;

// @ts-expect-error Parser options must retain their declared types.
posthtmlParser.parser("<Root />", { xmlMode: "true" });
