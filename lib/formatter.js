// super-simple formatter for a subset of markdown syntax
// **foo** becomes <strong>foo</strong>
// [foo](foo://foo.foo/foo) becomes a link to foo://foo.foo/foo

module.exports = function (string) {

  string = string.replace(/\*\*(.+)\*\*/g, function (outer, inner) {
    return '<strong>' + inner + '</strong>';
  });

  string = string.replace(/\[(.+)\]\((.+)\)/g, function (outer, name, url) {
    return '<a href="' + url + '">' + name + '</a>';
  });

  return string;
};
