module.exports = function (grunt) {

  'use strict';

  var util = require('util');
  var path = require('path');
  var async = require('async');
  var stylus = require('stylus');
  var nib = require('nib');

  var stylusHelpers = require('../lib/stylus-helpers');

  var template = require('../lib/template');
  var defaults = {
    'glob': [
      '**/*.styl'
    ]
  };

  function compile (code, options, callback) {

    function done (err, css) {
      if (err) {
        return callback(err);
      }
      callback(null, JSON.stringify(css));
    }

    try {
      stylus(code, {
        'compress': true,
        'paths': options.includes
      })
      .use(nib())
      .import('nib')
      .use(stylusHelpers)
      .render(done);
    } catch (e){
      callback(e);
    }
  }

  var suffixRegExp = /\.(styl)$/;
  function compileFile (options, file, callback) {
    var name = file.replace(suffixRegExp, '');
    var src = path.resolve(options.srcDir, file);
    var dest = path.resolve(options.destDir, name + '.js');

    // ensure the target destination exists
    grunt.file.mkdir(path.dirname(dest));

    // read the source
    var rawCode = grunt.file.read(src);

    // compile it
    compile(rawCode, options, function (err, generated) {

      // oopsie
      if (err) {
        grunt.log.error(err);
        grunt.warn(file + ' compilation failed');
        return callback && callback(err);
      }

      var module = util.format(template, name, generated);
      grunt.file.write(dest, module);
      grunt.log.debug('\u2713', src, dest);
      grunt.event.emit('stylus:compiled', file, name);
      callback && callback(null);
    });
  }

  function StylusCompileTask () {

    var that = this;
    var options = that.options(defaults);
    var done = that.async();

    var srcDir = options.srcDir;

    // find all matching files
    var files = grunt.file.expand({
      'cwd': srcDir
    }, options.glob);

    var fn = compileFile.bind(null, {
      'srcDir': srcDir,
      'destDir': options.destDir || srcDir,
      'includes': options.includes || []
    });

    grunt.event.on('watch', function (action, filepath) {
      var hasValidExt = grunt.file.isMatch(options.glob, filepath);
      var inCorrectPath = (filepath.indexOf(srcDir) === 0);
      if (inCorrectPath && hasValidExt) {
        var file = path.relative(srcDir, filepath);
        fn(file);
      }
    });

    async.eachLimit(files, 4, fn, done);
  }

  grunt.registerMultiTask('compile/stylus',
    'Compile stylus sheets as AMD modules', StylusCompileTask);
};