module.exports = function (grunt) {

  'use strict';

  var stylus = require('stylus');
  var nib = require('nib');
  var stylusHelpers = require('../lib/stylus-helpers');

  var suffixRegExp = /\.styl$/;
  var template = require('../lib/template');

  function name (file, options) {
    var prefixRegexp = new RegExp('^' + options.src + '/');
    return file.replace(prefixRegexp, '').replace(suffixRegExp, '');
  }

  function wrapWithSelector (raw, options) {

    var old = raw;
    var newLine = '\n';

    raw = options.wrapWithSelector + newLine;

    var lines = old.split('\n');

    lines.forEach(function (line) {
      raw += '  ' + line + newLine;
    });

    raw += newLine;

    return raw;
  }

  function compile (rawStylus, options, callback) {

    function done(err, css) {

      // oopsie
      if (err) {
        return callback(err);
      }

      callback(null, JSON.stringify(css.replace(/[\r\n\s]+/g, ' ')));
    }

    if (!!rawStylus && options.wrapWithSelector) {
      rawStylus = wrapWithSelector(rawStylus, options);
    }

    try {
      stylus(rawStylus, {
        'compress': true,
        'paths': [options.srcPath],
        'sassDebug': true
      })
      .use(nib())
      .import('nib')
      .use(stylusHelpers)
      .render(done);
    } catch (e){
      callback(e);
    }
  }

  var BaseCompileTask = require('../lib/base-compiler');
  function StyleCompileTask() {
    BaseCompileTask.call(this, grunt, {
      'type': 'stylus',
      'name': name,
      'template': template,
      'compile': compile,
      'options': {
        'src': 'src/styles',
        'dest': 'public/styles',
        'glob': '**/*.styl'
      }
    });
  }

  grunt.registerTask('compile/stylus',
    'Compile stylus sheets as AMD modules', StyleCompileTask);
  grunt.registerTask('compile/styles', ['compile/stylus']);
};