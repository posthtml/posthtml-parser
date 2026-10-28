const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parser } = require(process.env.POSTHTML_PARSER_PACKAGE || "..");

test("should be parse doctype in uppercase", () => {
  const tree = parser("<!DOCTYPE html>");
  const expected = ["<!DOCTYPE html>"];
  assert.deepEqual(tree, expected);
});

test("should be parse comment", () => {
  const tree = parser("<!--comment-->");
  const expected = ["<!--comment-->"];
  assert.deepEqual(tree, expected);
});

test("should be parse CDATA", () => {
  const tree = parser("<script><![CDATA[console.log(1);]]></script>", {
    xmlMode: true,
  });
  const expected = [{ tag: "script", content: ["console.log(1);"] }];
  assert.deepEqual(tree, expected);
});

test("should be parse tag with escape object in attribute", () => {
  const html =
    '<button data-bem="{&quot;button&quot;:{&quot;checkedView&quot;:&quot;extra&quot;}}"' + ' type="submit"></button>';
  const tree = parser(html);
  const expected = [
    {
      tag: "button",
      attrs: {
        type: "submit",
        "data-bem": '{"button":{"checkedView":"extra"}}',
      },
    },
  ];
  assert.deepEqual(tree, expected);
});

test.skip("should be parse tag with object in attribute data witchout escape", () => {
  const html = '<button data-bem="{"button":{"checkedView":"extra"}}"' + ' type="submit"></button>';
  const tree = parser(html);
  const expected = [
    {
      tag: "button",
      attrs: {
        type: "submit",
        "data-bem": '{"button":{"checkedView":"extra"}}',
      },
    },
  ];
  assert.deepEqual(tree, expected);
});

test.skip("should be parse tag with object in attribute data escape", () => {
  const json = JSON.stringify({ button: { checkedView: "extra" } });
  const html = '<button data-bem="' + json + '"' + ' type="submit"></button>';
  const tree = parser(html);
  const expected = [
    {
      tag: "button",
      attrs: {
        type: "submit",
        "data-bem": '{"button":{"checkedView":"extra"}}',
      },
    },
  ];
  assert.deepEqual(tree, expected);
});

test("should be parse isolated comment", () => {
  const tree = parser("<div><!--comment--></div>");
  const expected = [{ tag: "div", content: ["<!--comment-->"] }];
  assert.deepEqual(tree, expected);
});

test("should be parse comment before text content", () => {
  const tree = parser("<div><!--comment-->Text after comment</div>");
  const expected = [{ tag: "div", content: ["<!--comment-->", "Text after comment"] }];
  assert.deepEqual(tree, expected);
});

test("should be parse comment after text content", () => {
  const tree = parser("<div>Text before comment.<!--comment--></div>");
  const expected = [{ tag: "div", content: ["Text before comment.", "<!--comment-->"] }];
  assert.deepEqual(tree, expected);
});

test("should be parse comment in the middle of text content", () => {
  const tree = parser("<div>Text surrounding <!--comment--> a comment.</div>");
  const expected = [
    {
      tag: "div",
      content: ["Text surrounding ", "<!--comment-->", " a comment."],
    },
  ];
  assert.deepEqual(tree, expected);
});

test("should be parse doctype", () => {
  const tree = parser("<!doctype html>");
  const expected = ["<!doctype html>"];
  assert.deepEqual(tree, expected);
});

test("should be parse directive", () => {
  const options = {
    directives: [{ name: "?php", start: "<", end: ">" }],
  };
  const tree = parser('<?php echo "Hello word"; ?>', options);
  const expected = ['<?php echo "Hello word"; ?>'];
  assert.deepEqual(tree, expected);
});

test("should be parse regular expression directive", () => {
  const options = {
    directives: [{ name: /\?(php|=).*/, start: "<", end: ">" }],
  };
  const tree1 = parser('<?php echo "Hello word"; ?>', options);
  const expected1 = ['<?php echo "Hello word"; ?>'];
  const tree2 = parser('<?="Hello word"?>', options);
  const expected2 = ['<?="Hello word"?>'];

  assert.deepEqual(tree1, expected1);
  assert.deepEqual(tree2, expected2);
});

test("should be parse directives and tag", () => {
  const options = {
    directives: [
      { name: "!doctype", start: "<", end: ">" },
      { name: "?php", start: "<", end: ">" },
    ],
  };
  const html = '<!doctype html><header><?php echo "Hello word"; ?></header><body>{{%njk test %}}</body>';
  const tree = parser(html, options);
  const expected = [
    "<!doctype html>",
    {
      content: ['<?php echo "Hello word"; ?>'],
      tag: "header",
    },
    {
      content: ["{{%njk test %}}"],
      tag: "body",
    },
  ];
  assert.deepEqual(tree, expected);
});

test("should preserve custom HTML declarations", () => {
  const tree = parser("<!CUSTOM content><div>Text</div>", {
    directives: [{ name: "!custom", start: "<", end: ">" }],
  });

  assert.deepEqual(tree, ["<!CUSTOM content>", { tag: "div", content: ["Text"] }]);
});

test("should preserve comments that look like directives", () => {
  const html = "<!--?php echo 1; ?--><!--!CUSTOM content-->";
  const tree = parser(html, {
    directives: [
      { name: "?php", start: "<", end: ">" },
      { name: "!custom", start: "<", end: ">" },
    ],
  });

  assert.deepEqual(tree, ["<!--?php echo 1; ?-->", "<!--!CUSTOM content-->"]);
});

test("should preserve XML processing instruction delimiters", () => {
  const tree = parser('<?xml version="1.0"?><Root />', {
    xmlMode: true,
    directives: [{ name: "?xml", start: "<", end: ">" }],
  });

  assert.deepEqual(tree, ['<?xml version="1.0"?>', { tag: "Root" }]);
});

test("should preserve source locations after a processing instruction", () => {
  const instruction = '<?xml version="1.0"?>';
  const tree = parser(`${instruction}\n<Root />`, {
    xmlMode: true,
    sourceLocations: true,
    directives: [{ name: "?xml", start: "<", end: ">" }],
  });

  assert.deepEqual(tree, [
    instruction,
    "\n",
    {
      tag: "Root",
      location: {
        start: { line: 2, column: 1 },
        end: { line: 2, column: 8 },
      },
    },
  ]);
});

test("should preserve custom directive delimiters", () => {
  const tree = parser("<?php echo 1; ?>", {
    directives: [{ name: "?php", start: "[", end: "]" }],
  });

  assert.deepEqual(tree, ["[?php echo 1; ?]"]);
});

for (const instruction of [
  '<?xml version="1.0"?>',
  '<?xml version="1.0"?><?xml version="1.0"?>',
]) {
  test(`should locate a tag immediately after XML instructions: ${instruction}`, () => {
    const tree = parser(`${instruction}<Root />`, {
      xmlMode: true,
      sourceLocations: true,
    });

    assert.deepEqual(tree, [
      {
        tag: "Root",
        location: {
          start: { line: 1, column: instruction.length + 1 },
          end: { line: 1, column: instruction.length + 8 },
        },
      },
    ]);
  });
}

test("should locate an implied close after an XML instruction", () => {
  const html = '<Root><?xml version="1.0"?>';
  const tree = parser(html, { xmlMode: true, sourceLocations: true });

  assert.deepEqual(tree, [
    {
      tag: "Root",
      location: {
        start: { line: 1, column: 1 },
        end: { line: 1, column: html.length },
      },
    },
  ]);
});

test("should honor lowerCaseTags for SVG tags", () => {
  const tree = parser('<svg><linearGradient id="a"/><foreignObject><DIV>Text</DIV></foreignObject></svg>', {
    lowerCaseTags: true,
  });

  assert.deepEqual(tree, [
    {
      tag: "svg",
      content: [
        { tag: "lineargradient", attrs: { id: "a" } },
        { tag: "foreignobject", content: [{ tag: "div", content: ["Text"] }] },
      ],
    },
  ]);
});

test("should decode textarea entities when requested", () => {
  assert.deepEqual(parser("<textarea>&amp;</textarea>"), [
    { tag: "textarea", content: ["&amp;"] },
  ]);
  assert.deepEqual(parser("<textarea>&amp;</textarea>", { decodeEntities: true }), [
    { tag: "textarea", content: ["&"] },
  ]);
});

test("should decode entities only when requested", () => {
  const html = '<div title="&amp;">&amp;&#x1F600;</div>';

  assert.deepEqual(parser(html), [
    { tag: "div", attrs: { title: "&amp;" }, content: ["&amp;&#x1F600;"] },
  ]);
  assert.deepEqual(parser(html, { decodeEntities: true }), [
    { tag: "div", attrs: { title: "&" }, content: ["&😀"] },
  ]);
});

test("should be parse tag", () => {
  const tree = parser("<html></html>");
  const expected = [{ tag: "html" }];
  assert.deepEqual(tree, expected);
});

test("should be parse doctype and tag", () => {
  const tree = parser("<!doctype html><html></html>");
  const expected = ["<!doctype html>", { tag: "html" }];
  assert.deepEqual(tree, expected);
});

test("should be parse tag attrs", () => {
  const tree = parser('<div id="id" class="class"></div>');
  const expected = [
    {
      tag: "div",
      attrs: { id: "id", class: "class" },
    },
  ];
  assert.deepEqual(tree, expected);
});

test("should be parse text", () => {
  const tree = parser("Text");
  const expected = ["Text"];
  assert.deepEqual(tree, expected);
});

test("should be parse text in content", () => {
  const tree = parser("<div>Text</div>");
  const expected = [{ tag: "div", content: ["Text"] }];
  assert.deepEqual(tree, expected);
});

test("should be parse not a single node in tree", () => {
  const tree = parser("<span>Text1</span><span>Text2</span>Text3");
  const expected = [{ tag: "span", content: ["Text1"] }, { tag: "span", content: ["Text2"] }, "Text3"];
  assert.deepEqual(tree, expected);
});

test("should be parse not a single node in parent content", () => {
  const tree = parser("<div><span>Text1</span><span>Text2</span>Text3</div>");
  const expected = [
    {
      tag: "div",
      content: [{ tag: "span", content: ["Text1"] }, { tag: "span", content: ["Text2"] }, "Text3"],
    },
  ];
  assert.deepEqual(tree, expected);
});

test("should be parse camelCase tag name", () => {
  const tree = parser("<mySuperTag></mySuperTag>");
  const expected = [{ tag: "mySuperTag" }];
  assert.deepEqual(tree, expected);
});

test('should be parse simple contents are split with "<" in comment', () => {
  const html = "<a> /* width < 800px */ <hr /> test</a>";
  const tree = parser(html);
  const expected = [{ tag: "a", content: [" /* width < 800px */ ", { tag: "hr" }, " test"] }];
  assert.deepEqual(tree, expected);
});

test('should be parse style contents are split with "<" in comment', () => {
  const html = "<style> /* width < 800px */ @media (max-width: 800px) { /* selectors */} </style>";
  const tree = parser(html);
  const expected = [
    {
      tag: "style",
      content: [" /* width < 800px */ @media (max-width: 800px) { /* selectors */} "],
    },
  ];
  assert.deepEqual(tree, expected);
});

test('should be parse script contents are split with "<" in comment', () => {
  const html =
    "<script> var str = 'hey <form'; if (!str.match(new RegExp('<(form|iframe)', 'g'))) { /* ... */ }</script>";
  const tree = parser(html);
  const expected = [
    {
      tag: "script",
      content: [" var str = 'hey <form'; if (!str.match(new RegExp('<(form|iframe)', 'g'))) { /* ... */ }"],
    },
  ];
  assert.deepEqual(tree, expected);
});

test("should be not converting html entity name", () => {
  const html = "&zwnj;&nbsp;&copy;";
  const tree = parser(html);
  const expected = ["&zwnj;&nbsp;&copy;"];
  assert.deepEqual(tree, expected);
});

test("should parse with source locations", () => {
  const html = "<h1>Test</h1>\n<p><b>Foo</b><hr></p><p>Bar\n<hr>";
  const tree = parser(html, { sourceLocations: true });
  const expected = [
    {
      tag: "h1",
      content: ["Test"],
      location: {
        start: {
          line: 1,
          column: 1,
        },
        end: {
          line: 1,
          column: 13,
        },
      },
    },
    "\n",
    {
      tag: "p",
      content: [
        {
          tag: "b",
          content: ["Foo"],
          location: {
            start: {
              line: 2,
              column: 4,
            },
            end: {
              line: 2,
              column: 13,
            },
          },
        },
      ],
      location: {
        start: {
          line: 2,
          column: 1,
        },
        end: {
          line: 2,
          column: 13,
        },
      },
    },
    {
      tag: "hr",
      location: {
        start: {
          line: 2,
          column: 14,
        },
        end: {
          line: 2,
          column: 17,
        },
      },
    },
    {
      tag: "p",
      location: {
        start: {
          line: 2,
          column: 18,
        },
        end: {
          line: 2,
          column: 21,
        },
      },
    },
    {
      tag: "p",
      content: ["Bar\n"],
      location: {
        start: {
          line: 2,
          column: 22,
        },
        end: {
          line: 2,
          column: 28,
        },
      },
    },
    {
      tag: "hr",
      location: {
        start: {
          line: 3,
          column: 1,
        },
        end: {
          line: 3,
          column: 4,
        },
      },
    },
  ];
  assert.deepEqual(tree, expected);
});

test("should parse with input in button", () => {
  const html = '<button >Hello <input type="file" ng-hide="true" />PostHtml</button>';
  const tree = parser(html, { xmlMode: true });
  const expected = [
    {
      tag: "button",
      content: [
        "Hello ",
        {
          tag: "input",
          attrs: {
            type: "file",
            "ng-hide": "true",
          },
        },
        "PostHtml",
      ],
    },
  ];
  assert.deepEqual(tree, expected);
});

test("should parse no value attribute as `true` when `recognizeNoValueAttribute` is `true` ", () => {
  const tree = parser('<div class="className" hasClass>Content</div>', {
    recognizeNoValueAttribute: true,
  });
  const expected = [
    {
      tag: "div",
      attrs: { class: "className", hasClass: true },
      content: ["Content"],
    },
  ];
  assert.deepEqual(tree, expected);
});

test("should parse no value attribute as empty string when `recognizeNoValueAttribute` is `false` or not set ", () => {
  const tree = parser('<div class="className" hasClass>Content</div>');
  const expected = [
    {
      tag: "div",
      attrs: { class: "className", hasClass: "" },
      content: ["Content"],
    },
  ];
  assert.deepEqual(tree, expected);
});
