module.exports = (function() {

  'use strict';

  var fs = require('fs');
  var path = require('path');
  var util = require('util');

  function BaseCompileTask (grunt, params, callback) {

    // This is not a real task.. make grunt skip it
    if(this === grunt) {
      return;
    }

    // Utils
    var async = grunt.util.async;

    // populate options
    var options = this.options(params.options || {});

    // populate files
    var globRule = path.join(options.src, options.glob);
    var files = grunt.file.glob.sync(globRule);
    if(!files || files.length === 0) {
      grunt.log.writeln('no files');
      return;
    }

    // This task is async
    var done = this.async();

    // If a callback is passed, use that instead after everything is done compiling
    if(typeof callback === 'function') {
      var _done = done;
      done = function (err, data) {
        callback(err, data, options, _done);
      };
    }

    // Source & dest paths
    options.srcPath = path.resolve(options.src);
    options.destPath = path.resolve(options.dest);

    // Listen for reload events from regarde
    var type = params.type;
    grunt.event.on('regarde:' + type + ':file', function (status, file) {

      // don't try to compile deleted files
      if (status === 'deleted') {
        return;
      }

      grunt.event.emit('asset:compiling', type, file);

      process.nextTick(function () {
        // Compile the source file
        compileFile(file, function (err, data) {

          // error
          if (err) {
            grunt.warn(file + ' compilation failed');
            return;
          }

          // emit event for live-reload
          if (data && data.name) {
            process.nextTick(function () {
              grunt.event.emit('asset:compiled', type, file, data.name);
            });
          }
        });
      });
    });

    function compileFile (file, callback) {

      // extract the module name from the
      var name = params.name(file, options);

      // ensure the target destination exists
      var destFilePath = path.join(options.destPath, name + '.js');
      grunt.file.mkdir(path.dirname(destFilePath));

      // if the dest file exists,
      // if (fs.existsSync(destFilePath)) {
      //   // and it is newer than the source
      //   var srcTime = fs.statSync(file).mtime;
      //   var destTime = fs.statSync(destFilePath).mtime;
      //   // skip compilation
      //   if (srcTime < destTime) {
      //     grunt.log.debug('skipping', file);
      //     return callback(null, {
      //       'file': file,
      //       'name': name
      //     });
      //   }
      // }

      // read the file
      var rawCode = grunt.file.read(file);

      // compile
      params.compile(rawCode, options, function(err, generatedCode) {

        // oopsie
        if (err) {
          grunt.log.error(err);
          grunt.warn(file + ' compilation failed');
          return callback(err);
        }

        // write out the file
        var module = util.format(params.template, name, generatedCode);
        fs.writeFile(destFilePath, module, function() {
          var inFile = file.replace(options.src + '/',  '');
          var outFile = name + '.js';

          grunt.log.debug('\u2713', inFile, '\u2192', outFile);

          callback(null, {
            'file': file,
            'name': name
          });
        });
      });
    }

    // compilation should be asynchronous
    async.map(files, compileFile, done);
  }

  return BaseCompileTask;

})();
