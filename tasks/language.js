var escape = require('../lib/escapeHTML');
var markdown = require('../lib/markdown');

module.exports = function(grunt) {

  'use strict';

  var fs = require('fs');
  var path = require('path');
  var util = require('util');

  var langMetaData = require('../data/languages-metadata');
  var enabledLanguages = {};
  var enabledLabels = {};

  var suffixRegExp = /\/Localizable\.strings$/;
  var lineParsingRegExp = /^\s*\"([a-zA-Z0-9_\-\$]+)\"\s*=\s*\"(.*)\";\s*$/;
  var template = require('../lib/template');

  function resolveLangCode (langCode) {

    // GetLocalization doesn't follow ISO codes, fix the names
    langCode = langCode.replace(/\-/g, '_');

    var metaData = langMetaData[langCode];
    while (metaData && metaData.alias) {
      langCode = metaData.alias;
      metaData = langMetaData[langCode];
    }

    // if there is no metadata for this language, then drop out
    if(!metaData) {
      grunt.warn('Language missing:' + langCode);
      return;
    }

    return {
      'code': langCode,
      'data': metaData
    };
  }

  function fileToCode (file, options) {
    var prefixRegexp = new RegExp('^' + options.src + '/');
    return file.replace(prefixRegexp, '').replace(suffixRegExp, '');
  }

  function name (file, options) {
    var langCode = fileToCode(file, options);
    var resolved = resolveLangCode(langCode);
    return resolved && resolved.data.file;
  }

  function replaceWithNum (x, y, num) {
    return '$' + (num || '');
  }

  function compile (rawLanguageData, options, callback) {

    var json = {};

    var lines = rawLanguageData.split(/[\r\n]+/);
    lines.forEach(function(line) {

      var sections = line.match(lineParsingRegExp);
      if (sections && sections.length >= 2 && !sections[1].match(/\s/)) {

        var key = sections[1];
        if (!(enabledLabels[key])) {
          return;
        }

        var value = sections[2];

        var regexps = [
          /%((\d+)\$)?@/g,
          /@((\d+)\$)?%/g
        ];

        regexps.forEach(function (regexp) {
          value = value.replace(regexp, replaceWithNum);
        });

        value = value.replace(/\\\"/g, '"');

        json[key] = markdown(escape(value));
      }
    });

    callback(null, JSON.stringify(json));
  }

  function compileAvailable(err, languages, options, done) {

    var available = {};

    options.compiled = [];

    // Generate a map of available & enabled languages
    languages.forEach(function(lang) {

      var langCode = fileToCode(lang.file, options);
      var resolved = resolveLangCode(langCode);

      if(!resolved) {
        return;
      }

      var metaData = resolved.data;
      langCode = resolved.code;

      // Skip disabled languages
      if(!enabledLanguages[langCode]) {
        return;
      }

      available[langCode] = {
        'file': metaData.file,
        'name': metaData.name
      };

      // push the list into an array that other tasks can user
      options.compiled.push(metaData.file);

      // Add directiorn info for rtl languages
      if(metaData.dir) {
        available[langCode].dir = metaData.dir;
      }
    });

    // Copy over all the enabled aliases
    var aliases = {};
    Object.keys(langMetaData).forEach(function (langCode) {
      var metaData = langMetaData[langCode];
      if(metaData.alias && metaData.alias in available) {
        aliases[langCode] = metaData.alias;
      }
    });
    available.aliases = aliases;

    var destFilePath = path.join(options.destPath, 'available.js');
    var module = util.format(template, 'available', JSON.stringify(available));
    fs.writeFile(destFilePath, module, function() {
      grunt.log.debug('\u2713', 'languages/available');
      done();
    });
  }

  var BaseCompileTask = require('../lib/base-compiler');
  function LanguageCompileTask() {

    var options = this.options({
      'src': 'src/languages/strings',
      'dest': 'public/languages',
      'glob': '**/Localizable.strings',
      'labels': 'data/labels.txt',
      'languages': ['en']
    });

    // pre-populate the available-languages map
    if(options.languages.length) {
      options.languages.forEach(function (langCode) {
        var resolved = resolveLangCode(langCode);
        enabledLanguages[resolved.code] = resolved.data;
      });
    }

    // pre-populate the valid-labels map
    if(options.labels) {
      var labelsFilePath = path.resolve(options.labels);

      var exists = fs.existsSync(labelsFilePath);
      if(!exists) {
        grunt.fatal('languages: ' + labelsFilePath + ' does not exists');
      }

      var labels = fs.readFileSync(labelsFilePath).toString();
      labels = labels.split(/[\n\r\t\s]/g);
      labels.forEach(function(label) {
        enabledLabels[label] = true;
      });
    }

    BaseCompileTask.call(this, grunt, {
      'type': 'language',
      'name': name,
      'template': template,
      'compile': compile,
      'options': options
    }, compileAvailable);
  }

  grunt.registerTask('compile/languages',
    'Compile localization data as AMD modules', LanguageCompileTask);
};