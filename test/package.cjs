const assert = require("node:assert/strict");
const { pathToFileURL } = require("node:url");

function checkParser(parser) {
  assert.equal(typeof parser, "function");
  assert.deepEqual(
    parser("<Component checked><Child /></Component>", {
      xmlMode: true,
      recognizeNoValueAttribute: true,
    }),
    [{ tag: "Component", attrs: { checked: true }, content: [{ tag: "Child" }] }],
  );
  assert.deepEqual(
    parser("<?php echo 1; ?><p>ok</p>", {
      directives: [{ name: "?php", start: "<", end: ">" }],
    }),
    ["<?php echo 1; ?>", { tag: "p", content: ["ok"] }],
  );
  assert.deepEqual(
    parser('<?xml version="1.0"?>\n<Root />', {
      xmlMode: true,
      sourceLocations: true,
      directives: [{ name: "?xml", start: "<", end: ">" }],
    }),
    [
      '<?xml version="1.0"?>',
      "\n",
      {
        tag: "Root",
        location: {
          start: { line: 2, column: 1 },
          end: { line: 2, column: 8 },
        },
      },
    ],
  );
}

async function main() {
  const entry = require.resolve(process.argv[2] || "..");
  checkParser(require(entry).parser);
  checkParser((await import(pathToFileURL(entry).href)).parser);
  console.log("Package checks passed (CommonJS and native ESM).");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
