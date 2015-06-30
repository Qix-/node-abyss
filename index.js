'use strict';

var util = require('util');
var async = require('async');

var abyss = module.exports = {completely:{}};

var nativeConstructors = [
  Array,
  String,
  Boolean,
  Number,
  RegExp
];

function resolve(obj, path) {
  var cur = obj;
  for (var i in path) {
    cur = cur[path[i]];
  }
  return cur;
}

abyss.traverse = function traverse(obj, itrfn, cb, path) {
  path = path || [];

  if (typeof obj !== 'object'
      || nativeConstructors.indexOf(obj.constructor) !== -1) {
    return itrfn(obj, path, cb);
  }

  async.each(Object.keys(obj), function(key, cb) {
    var val = obj[key];
    var thisPath = path.concat(key);
    abyss.traverse(val, itrfn, cb, thisPath);
  }, cb);
};

abyss.traverseBoth = function traverseBoth(objA, objB, match, missing, cb) {
  abyss.traverse(objA,
    function(v, path, cb) {
      var vb;
      try {
        vb = resolve(objB, path);
        if (vb === undefined) {
          throw true;
        }
      } catch(e) {
        return missing(path, cb);
      }
      match(v, vb, path, cb);
    },
    cb);
};

abyss.equals = function equals(objA, objB, strict, cb) {
  if (typeof strict === 'function') {
    cb = strict;
    strict = false;
  }

  abyss.traverseBoth(objA, objB,
      function(vA, vB, path, cb) {
        if (strict ? vA === vB : vA == vB)
          return cb();
        return cb(true);
      },
      function(path, cb) {
        cb();
      },
      function(err) {
        cb(!!!err);
      });
};

abyss.test = function test(objA, objB, cb) {
  abyss.traverseBoth(objA, objB,
      function(vA, vB, path, cb) {
        var result = null;
        switch (true) {
        case vA instanceof RegExp:
          result = vA.test(vB.toString());
          break;
        case typeof vA === 'function':
          result = vA(vB);
          break;
        default:
          result = vA == vB;
          break;
        }

        if (!result) {
          return cb(true);
        }
        cb();
      },
      function(path, cb) {
        cb();
      },
      function(err) {
        cb(!!!err);
      });
};

abyss.clone = function clone(obj, cb) {
  var newObj = {};
  async.each(Object.keys(obj),
      function(key, cb) {
        var val = obj[key];
        switch (true) {
        case util.isArray(val):
          newObj[key] = val.slice(0);
          return cb();
        case typeof val === 'object':
          abyss.clone(val, function(err, cloned) {
            if (err) {
              return cb(err);
            }
            newObj[key] = cloned;
            cb();
          });
          return;
        default:
          newObj[key] = val;
          return cb();
        }
      },
      function(err) {
        if (err) {
          return cb(err);
        }
        cb(null, newObj);
      });
};

abyss.transform = function transform(objA, objB, cb) {
  abyss.traverseBoth(objA, objB,
      function(vA, vB, path, cb) {
        switch (true) {
        case util.isArray(vA) && vA.length === 2
          && vA[0] && vA[0] instanceof RegExp
          && vA[1] && (vA[1].constructor === String
              || typeof vA[1] === 'function'):
          vB = vB.toString().replace(vA[0], vA[1]);
          break;
        case typeof vA === 'function':
          vB = vA(vB);
          break;
        default:
          vB = vA;
          break;
        }

        if (path.length) {
          var node = path.pop();
          var cur = resolve(objB, path);
          cur[node] = vB;
        } else {
          objB = vB;
        }
        cb();
      },
      function(path, cb) {
        cb();
      },
      function(err) {
        if (err) {
          return cb(err);
        }
        cb(null, objB);
      });
};
