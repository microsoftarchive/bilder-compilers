var marked = require('marked');

// marked wraps everything in a <p>, remove it
function unwrapMarkdown (string) {

  string = string.trim();

  var lastIndex = string.length - 4;
  var startsWithParagraph = string.indexOf('<p>') === 0;
  var endsWithParagraph = string.indexOf('</p>') === lastIndex;

  if (startsWithParagraph && endsWithParagraph) {
    string = string.substr(0, lastIndex).substr(3);
  }

  return string;
}

module.exports = function (string) {

  return unwrapMarkdown(marked(string));
};