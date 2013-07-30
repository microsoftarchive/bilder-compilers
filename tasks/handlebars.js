module.exports = function(grunt, options) {

  'use strict';

  var handlebars = require('handlebars');

  var suffixRegExp = /\.tmpl$/;
  var template = [
    "define(['vendor/handlebars'], function(H) {",
      "var name = '%s';",
      "return H.template(%s);",
    "});"
  ].join('\n');

  function name (file, options) {
    var prefixRegexp = new RegExp('^' + options.src + '/');
    return file.replace(prefixRegexp, '').replace(suffixRegExp, '');
  }

  // compile the template
  function compile (rawTemplate, options, callback) {
    try {
      // new lines what?
      rawTemplate = rawTemplate.replace(/[\r\n\s]+/g, ' ');
      // render the compiled template
      var funcString = handlebars.precompile(rawTemplate);
      callback(null, funcString);
    } catch(e) {
      callback(e);
    }
  }

  var BaseCompileTask = require('../lib/base-compiler');
  function HandlebarsCompileTask() {
    BaseCompileTask.call(this, grunt, {
      'type': 'handlebars',
      'name': name,
      'template': template,
      'compile': compile,
      'options': {
        'src': 'src/templates',
        'dest': 'public/templates',
        'glob': '**/*.tmpl'
      }
    });
  }

  grunt.registerTask('compile/handlebars', 'Compile handlebars templates as AMD modules', HandlebarsCompileTask);
};