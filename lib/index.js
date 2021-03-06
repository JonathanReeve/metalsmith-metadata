var path = require('path');
var extname = path.extname;
var yaml = require('js-yaml');
var markdown = require('markdown-it')();
var _ = require('lodash'); 

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * Supported metadata parsers.
 */

var parsers = {
  '.json': JSON.parse,
  '.yaml': yaml.safeLoad,
  '.yml': yaml.safeLoad,
  '.yamlmd': yaml.safeLoad
};

function deepMap(obj, iterator) {
  return _.transform(obj, (result, val, key) => {
    result[key] = _.isObject(val) ? deepMap(val, iterator) : iterator(val)
  })
}

function plugin(opts){
  opts = opts || {};

  return function(files, metalsmith, done){
    var metadata = metalsmith.metadata();
    var exts = Object.keys(parsers);
    for (var key in opts) {
      var file = opts[key].replace(/(\/|\\)/g, path.sep);
      var ext = extname(file);
      if (!~exts.indexOf(ext)) throw new Error('unsupported metadata type "' + ext + '"');
      if (!metadata[key] || files[file]) {
        if (!files[file]) throw new Error('file "' + file + '" not found');

        var parse = parsers[ext];
        var str = files[file].contents.toString();
        delete files[file];

        try {
          var data = parse(str);
        } catch (e) {
          return done(new Error('malformed data in "' + file + '"'));
        }

        if (ext == '.yamlmd') { 
	  data = deepMap(data, (m) => markdown.renderInline(m))
        } 

        metadata[key] = data;
      }
    }

    done();
  };
}
