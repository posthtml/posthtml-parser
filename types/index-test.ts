import parser = require('../');

parser.defaultDirectives = [];
parser.defaultOptions.lowerCaseTags = true;
parser.defaultOptions.lowerCaseAttributeNames = true;

const ast = parser('code');

ast.forEach(node => {
    console.log(node.tag, node.attrs, node.content);
});
