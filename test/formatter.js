var formatter = require('../lib/formatter');
var expect = require('chai').expect;

describe('formatter', function () {

  it('should format strings as bold', function () {

    var formatted = formatter('asdf **foo** asdf');
    var expected = 'asdf <strong>foo</strong> asdf';
    expect(formatted).to.equal(expected);
  });
});
