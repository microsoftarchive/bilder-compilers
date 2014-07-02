var formatter = require('../lib/formatter');
var expect = require('chai').expect;

function testFormat (type, before, after) {

  it('should support ' + type + ' syntax', function () {

    var formatted = formatter(before);
    expect(formatted).to.equal(after);
  });
}

describe('formatter', function () {

  testFormat('bold', 'asdf **foo** asdf', 'asdf <strong>foo</strong> asdf');

  var linked = 'asdf <a href="foo://foo.foo/foo">foo</a> asdf';
  testFormat('links', 'asdf [foo](foo://foo.foo/foo) asdf', linked);
});
