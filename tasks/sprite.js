module.exports = function (grunt) {

  'use strict';

  var spritesmith = require('spritesmith');
  var optipng = require('optipng-bin');
  var filesize = require('filesize');
  require('colors');

  var fs = require('fs');
  var path = require('path');
  var _ = grunt.util._;

  function coordsToStylus (name, coords) {

    var stylus = '$' + name + ' = ';
    stylus += '-' + coords.x + 'px ' ;
    stylus += '-' + coords.y + 'px ';
    stylus += coords.width + 'px ';
    stylus += coords.height + 'px';

    return stylus;
  }

  function minifiyImage(file, options, callback) {

    file = path.resolve(file);

    var optipngArgs = ['-strip', 'all', '-o', options.compression, '-out', file, file];
    var originalSize = fs.statSync(file).size;

    grunt.util.spawn({
      'cmd': optipng.path,
      'args': optipngArgs
    }, function (err, result, code) {

      var newSize = fs.statSync(file).size;
      var diff = originalSize - newSize;
      if(result.stderr.indexOf('already optimized') !== -1 || diff < 10) {
        grunt.log.writeln('  \u2713'.green, 'already optimized');
      } else {
        grunt.log.writeln('  \u2713'.green, 'optimized', filesize(newSize, 2, false));
        grunt.log.writeln('--- saved', filesize(diff, 2, false));
      }

      process.nextTick(callback);
    });
  }

  function generated (options, target, filePath, destStylus, destImage, callback) {

    return function (error, result) {

      if (error) {
        grunt.fatal('failed generating sprite - ' + target);
      }

      if(!options.skipStylus) {

        var stylus = [ '$' + target + '_file = "' + filePath + '"' ];
        var names = [];

        _.each(result.coordinates, function (coords, file) {

          var lastIndex = file.lastIndexOf('/');
          file = file.substr(lastIndex + 1).replace(/\.(png|jpeg|jpg)$/, '');
          stylus.push(coordsToStylus(target + '-' + file, coords));
          names.push(file);
        });

        stylus.push('$' + target + '_names = ' + names.join(' '));

        grunt.file.write(destStylus, stylus.join('\n'));
      }

      grunt.file.write(destImage, result.image, {
        'encoding': 'binary'
      });

      var size = filesize(fs.statSync(destImage).size, 2, false);
      grunt.log.writeln('  \u2713'.green, 'generated', size);

      callback(destImage);
    };
  }

  function SpriteTask() {

    var done = this.async();
    var target = this.target;
    var options = this.options({
      'algorithm': 'binary-tree',
      'compression': 3,
      'engine': 'auto',
      'format': 'png',
      'destDir': 'public/images/sprites',
      'displayDir': 'images/sprites',
      'srcDir': 'src/sprites',
      'stylusDir': 'src/styles/sprites'
    });

    var baseDir = options.srcDir + '/' + target;
    var files = grunt.file.expand({
      'cwd': baseDir
    }, [
      '**/*.png',
      '**/*.jpeg',
      '**/*.jpg'
    ]).map(function (file) {
      return path.join(baseDir, file);
    });

    var destStylus = path.join(options.stylusDir, this.target + '.styl');

    if (!files.length) {
      grunt.file.write(destStylus, '');
      grunt.log.warn('no files for', target);
      return done();
    }

    var destImage = path.join(options.destDir, this.target + '.png');
    var displayDir = options.displayDir;
    var filePath = displayDir ? path.join(displayDir, this.target + '.png') : destImage;

    // get the timestamp of the last modified file
    // var lastMtime = new Date(0);
    // files.forEach(function (file) {
    //   var mtime = fs.statSync(file).mtime;
    //   if (mtime > lastMtime) {
    //     lastMtime = mtime;
    //   }
    // });

    // // if they are all older than the generated file, they don't need building
    // if (fs.existsSync(destImage) && fs.statSync(destImage).ctime > lastMtime) {
    //   grunt.log.debug('skipping sprite:', this.target);
    //   return done();
    // }

    var smithArgs = {
      'src': files,
      'engine': options.engine,
      'algorithm': options.algorithm,
      'exportOpts': {
        'format': options.format
      }
    };

    var callback = generated (options, target, filePath, destStylus, destImage, function (destImage) {
      minifiyImage(destImage, options, done);
    });

    spritesmith(smithArgs, callback);
  }

  grunt.registerMultiTask('compile/sprite', 'sprite builder and stylus exporter', SpriteTask);
};
