import test from 'ava';
import { parser, Node } from '../src';

test('should be parse doctype in uppercase', t => {
  const tree = parser('<!DOCTYPE html>');
  const expected: Node[] = [{ text: '<!DOCTYPE html>' }];
  expected[0].parent = expected;
  t.deepEqual(tree, expected);
});

test('should be parse comment', t => {
  const tree = parser('<!--comment-->');
  const expected: Node[] = [{ text: '<!--comment-->' }];
  expected[0].parent = expected;
  t.deepEqual(tree, expected);
});

test('should be parse CDATA', t => {
  const tree = parser('<script><![CDATA[console.log(1);]]></script>', { xmlMode: true });
  const expected: Node[] = [{ tag: 'script', content: [{ text: 'console.log(1);' }] }];
  expected[0].parent = expected;
  expected[0].content[0].parent = expected[0];
  t.deepEqual(tree, expected);
});

test('should be parse tag with escape object in attribute', t => {
  const html = '<button data-bem="{&quot;button&quot;:{&quot;checkedView&quot;:&quot;extra&quot;}}"' +
    ' type="submit"></button>';
  const tree = parser(html);
  const expected: Node[] = [
    {
      tag: 'button',
      attrs: {
        type: 'submit',
        'data-bem': '{"button":{"checkedView":"extra"}}'
      }
    }
  ];
  expected[0].parent = expected;
  t.deepEqual(tree, expected);
});

test.skip('should be parse tag with object in attribute data witchout escape', t => {
  const html = '<button data-bem="{"button":{"checkedView":"extra"}}"' +
    ' type="submit"></button>';
  const tree = parser(html);
  const expected: Node[] = [
    {
      tag: 'button',
      attrs: {
        type: 'submit',
        'data-bem': '{"button":{"checkedView":"extra"}}'
      }
    }
  ];
  expected[0].parent = expected;
  t.deepEqual(tree, expected);
});

test.skip('should be parse tag with object in attribute data escape', t => {
  const json = JSON.stringify({ button: { checkedView: 'extra' } });
  const html = '<button data-bem="' + json + '"' +
    ' type="submit"></button>';
  const tree = parser(html);
  const expected: Node[] = [
    {
      tag: 'button',
      attrs: {
        type: 'submit',
        'data-bem': '{"button":{"checkedView":"extra"}}'
      }
    }
  ];
  expected[0].parent = expected;
  t.deepEqual(tree, expected);
});

test('should be parse isolated comment', t => {
  const tree = parser('<div><!--comment--></div>');
  const expected: Node[] = [{ tag: 'div', content: [{ text: '<!--comment-->' }] }];
  expected[0].parent = expected;
  expected[0].content[0].parent = expected[0];
  t.deepEqual(tree, expected);
});

test('should be parse comment before text content', t => {
  const tree = parser('<div><!--comment-->Text after comment</div>');
  const expected: Node[] = [{ tag: 'div', content: [{ text: '<!--comment-->' }, { text: 'Text after comment' }] }];
  expected[0].parent = expected;
  expected[0].content[0].parent = expected[0];
  expected[0].content[1].parent = expected[0];
  t.deepEqual(tree, expected);
});

test('should be parse comment after text content', t => {
  const tree = parser('<div>Text before comment.<!--comment--></div>');
  const expected: Node[] = [{ tag: 'div', content: [{ text: 'Text before comment.' }, { text: '<!--comment-->' }] }];
  expected[0].parent = expected;
  expected[0].content[0].parent = expected[0];
  expected[0].content[1].parent = expected[0];
  t.deepEqual(tree, expected);
});

test('should be parse comment in the middle of text content', t => {
  const tree = parser('<div>Text surrounding <!--comment--> a comment.</div>');
  const expected: Node[] = [{ tag: 'div', content: [{ text: 'Text surrounding ' }, { text: '<!--comment-->' }, { text: ' a comment.' }] }];
  expected[0].parent = expected;
  expected[0].content[0].parent = expected[0];
  expected[0].content[1].parent = expected[0];
  expected[0].content[2].parent = expected[0];
  t.deepEqual(tree, expected);
});

test('should be parse doctype', t => {
  const tree = parser('<!doctype html>');
  const expected: Node[] = [{ text: '<!doctype html>' }];
  expected[0].parent = expected;
  t.deepEqual(tree, expected);
});

test('should be parse directive', t => {
  const options = {
    directives: [
      { name: '?php', start: '<', end: '>' }
    ]
  };
  const tree = parser('<?php echo "Hello word"; ?>', options);
  const expected: Node[] = [{ text: '<?php echo "Hello word"; ?>' }];
  expected[0].parent = expected;
  t.deepEqual(tree, expected);
});

test('should be parse regular expression directive', t => {
  const options = {
    directives: [
      { name: /\?(php|=).*/, start: '<', end: '>' }
    ]
  };
  const tree1 = parser('<?php echo "Hello word"; ?>', options);
  const expected1: Node[] = [{ text: '<?php echo "Hello word"; ?>' }];
  expected1[0].parent = expected1;
  const tree2 = parser('<?="Hello word"?>', options);
  const expected2: Node[] = [{ text: '<?="Hello word"?>' }];
  expected2[0].parent = expected2;

  t.deepEqual(tree1, expected1);
  t.deepEqual(tree2, expected2);
});

test('should be parse directives and tag', t => {
  const options = {
    directives: [
      { name: '!doctype', start: '<', end: '>' },
      { name: '?php', start: '<', end: '>' }
    ]
  };
  const html = '<!doctype html><header><?php echo "Hello word"; ?></header><body>{{%njk test %}}</body>';
  const tree = parser(html, options);
  const expected: Node[] = [
    { text: '<!doctype html>' },
    {
      content: [{ text: '<?php echo "Hello word"; ?>' }],
      tag: 'header'
    },
    {
      content: [{ text: '{{%njk test %}}' }],
      tag: 'body'
    }
  ];
  expected[0].parent = expected;
  expected[1].parent = expected;
  expected[1].content[0].parent = expected[1];
  expected[2].parent = expected;
  expected[2].content[0].parent = expected[2];
  t.deepEqual(tree, expected);
});

test('should be parse tag', t => {
  const tree = parser('<html></html>');
  const expected: Node[] = [{ tag: 'html' }];
  expected[0].parent = expected;
  t.deepEqual(tree, expected);
});

test('should be parse doctype and tag', t => {
  const tree = parser('<!doctype html><html></html>');
  const expected: Node[] = [{ text: '<!doctype html>' }, { tag: 'html' }];
  expected[0].parent = expected;
  expected[1].parent = expected;
  t.deepEqual(tree, expected);
});

test('should be parse tag attrs', t => {
  const tree = parser('<div id="id" class="class"></div>');
  const expected: Node[] = [{
    tag: 'div', attrs: { id: 'id', class: 'class' }
  }];
  expected[0].parent = expected;
  t.deepEqual(tree, expected);
});

test('should be parse text', t => {
  const tree = parser('Text');
  const expected: Node[] = [{ text: 'Text' }];
  expected[0].parent = expected;
  t.deepEqual(tree, expected);
});

test('should be parse text in content', t => {
  const tree = parser('<div>Text</div>');
  const expected: Node[] = [{ tag: 'div', content: [{ text: 'Text' }] }];
  expected[0].parent = expected;
  expected[0].content[0].parent = expected[0];
  t.deepEqual(tree, expected);
});

test('should be parse not a single node in tree', t => {
  const tree = parser('<span>Text1</span><span>Text2</span>Text3');
  const expected: Node[] = [
    { tag: 'span', content: [{ text: 'Text1' }] },
    { tag: 'span', content: [{ text: 'Text2' }] },
    { text: 'Text3' }
  ];
  expected[0].parent = expected;
  expected[0].content[0].parent = expected[0];
  expected[1].parent = expected;
  expected[1].content[0].parent = expected[1];
  expected[2].parent = expected;
  t.deepEqual(tree, expected);
});

test('should be parse not a single node in parent content', t => {
  const tree = parser('<div><span>Text1</span><span>Text2</span>Text3</div>');
  const expected: Node[] = [
    {
      tag: 'div',
      content: [
        { tag: 'span', content: [{ text: 'Text1' }] },
        { tag: 'span', content: [{ text: 'Text2' }] },
        { text: 'Text3' }
      ]
    }
  ];
  expected[0].parent = expected;
  expected[0].content[0].parent = expected[0];
  expected[0].content[0].content[0].parent = expected[0].content[0];
  expected[0].content[1].parent = expected[0];
  expected[0].content[1].content[0].parent = expected[0].content[1];
  expected[0].content[2].parent = expected[0];
  t.deepEqual(tree, expected);
});

test('should be parse camelCase tag name', t => {
  const tree = parser('<mySuperTag></mySuperTag>');
  const expected: Node[] = [
    { tag: 'mySuperTag' }
  ];
  expected[0].parent = expected;
  t.deepEqual(tree, expected);
});

test('should be parse simple contents are split with "<" in comment', t => {
  const html = '<a> /* width < 800px */ <hr /> test</a>';
  const tree = parser(html);
  const expected: Node[] = [
    { tag: 'a', content: [{ text: ' /* width < 800px */ ' }, { tag: 'hr' }, { text: ' test' }] }
  ];
  expected[0].parent = expected;
  expected[0].content[0].parent = expected[0];
  expected[0].content[1].parent = expected[0];
  expected[0].content[2].parent = expected[0];
  t.deepEqual(tree, expected);
});

test('should be parse style contents are split with "<" in comment', t => {
  const html = '<style> /* width < 800px */ @media (max-width: 800px) { /* selectors */} </style>';
  const tree = parser(html);
  const expected: Node[] = [
    { tag: 'style', content: [{ text: ' /* width < 800px */ @media (max-width: 800px) { /* selectors */} ' }] }
  ];
  expected[0].parent = expected;
  expected[0].content[0].parent = expected[0];
  t.deepEqual(tree, expected);
});

test('should be parse script contents are split with "<" in comment', t => {
  const html = '<script> var str = \'hey <form\'; if (!str.match(new RegExp(\'<(form|iframe)\', \'g\'))) { /* ... */ }</script>';
  const tree = parser(html);
  const expected: Node[] = [
    {
      tag: 'script',
      content: [
        { text: ' var str = \'hey <form\'; if (!str.match(new RegExp(\'<(form|iframe)\', \'g\'))) { /* ... */ }' }
      ]
    }
  ];
  expected[0].parent = expected;
  expected[0].content[0].parent = expected[0];
  t.deepEqual(tree, expected);
});

test('should be not converting html entity name', t => {
  const html = '&zwnj;&nbsp;&copy;';
  const tree = parser(html);
  const expected: Node[] = [{ text: '&zwnj;&nbsp;&copy;' }];
  expected[0].parent = expected;
  t.deepEqual(tree, expected);
});

test('should parse with source locations', t => {
  const html = '<h1>Test</h1>\n<p><b>Foo</b></p>';
  const tree = parser(html, { sourceLocations: true });
  const expected: Node[] = [
    {
      tag: 'h1',
      content: [{ text: 'Test' }],
      location: {
        start: {
          line: 1,
          column: 1
        },
        end: {
          line: 1,
          column: 13
        }
      }
    },
    { text: '\n' },
    {
      tag: 'p',
      content: [
        {
          tag: 'b',
          content: [{ text: 'Foo' }],
          location: {
            start: {
              line: 2,
              column: 4
            },
            end: {
              line: 2,
              column: 13
            }
          }
        }
      ],
      location: {
        start: {
          line: 2,
          column: 1
        },
        end: {
          line: 2,
          column: 17
        }
      }
    }
  ];
  expected[0].parent = expected;
  expected[0].content[0].parent = expected[0];
  expected[1].parent = expected;
  expected[2].parent = expected;
  expected[2].content[0].parent = expected[2];
  expected[2].content[0].content[0].parent = expected[2].content[0];
  t.deepEqual(tree, expected);
});

test('should parse with input in button', t => {
  const html = '<button >Hello <input type="file" ng-hide="true" />PostHtml</button>';
  const tree = parser(html, { xmlMode: true });
  const expected: Node[] = [
    {
      tag: 'button',
      content: [
        { text: 'Hello ' },
        {
          tag: 'input',
          attrs: {
            type: 'file',
            'ng-hide': 'true'
          }
        },
        { text: 'PostHtml' }
      ]
    }
  ];
  expected[0].parent = expected;
  expected[0].content[0].parent = expected[0];
  expected[0].content[1].parent = expected[0];
  expected[0].content[2].parent = expected[0];
  t.deepEqual(tree, expected);
});
