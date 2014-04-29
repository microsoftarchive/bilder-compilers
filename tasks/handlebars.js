module.exports = function (grunt) {

  'use strict';

  var util = require('util');
  var path = require('path');
  var async = require('async');
  var handlebars = require('handlebars');

  var template = require('../lib/template');
  var defaults = {
    'glob': [
      '**/*.tmpl',
      '**/*.hbs'
    ]
  };

  function compile (code, callback) {
    // strip all new-line chars
    code = code.replace(/[\r\n\s]+/g, ' ');
    // render the compiled template
    try {
      callback(null, handlebars.precompile(code));
    } catch (e) {
      callback(e);
    }
  }

  var suffixRegExp = /\.(tmpl|hbs)$/;
  function compileFile (options, file, callback) {
    var name = file.replace(suffixRegExp, '');
    var src = path.resolve(options.srcDir, file);
    var dest = path.resolve(options.destDir, name + '.js');

    // ensure the target destination exists
    grunt.file.mkdir(path.dirname(dest));

    // read the source
    var rawCode = grunt.file.read(src);

    // compile it
    compile(rawCode, function (err, generated) {

      // oopsie
      if (err) {
        grunt.log.error(err);
        grunt.warn(file + ' compilation failed');
        return callback && callback(err);
      }

      var module = util.format(template, name, generated);
      grunt.file.write(dest, module);
      grunt.log.debug('\u2713', src);
      grunt.event.emit('handlebars:compiled', file, name);
      callback && callback(null);
    });
  }

  function HandlebarsCompileTask () {

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
      'destDir': options.destDir || srcDir
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

  grunt.registerMultiTask('compile/handlebars',
    'Compile handlebars templates as AMD modules', HandlebarsCompileTask);
};