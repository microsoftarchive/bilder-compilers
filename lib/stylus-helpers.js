module.exports = (function() {

  'use strict';

  var stylus = require('stylus');
  var nodes = stylus.nodes;

  function replace (source, toFind, toReplace) {
    source = (source || {}).val || '';
    var dest = source.replace(toFind.val, toReplace.val);
    return new nodes.String(dest);
  }

  return function (style) {
    style.define('replace', replace);
  };

}).call();