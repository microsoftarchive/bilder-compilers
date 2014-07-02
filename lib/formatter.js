// super-simple formatter for a subset of markdown syntax
// **foo** becomes <strong>foo</strong>

module.exports = function (string) {

  string = string.replace(/\*\*(.+)\*\*/g, function (outer, inner) {
    return '<strong>' + inner + '</strong>';
  });

  return string;
};
