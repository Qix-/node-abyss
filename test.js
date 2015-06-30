'use strict';

var abyss = require('./');
var should = require('should');

var obj = {
  a: 1,
  b: {
    c: 2,
    d: 3,
    e: {
      f: 4
    }
  },
  g: {
    h: 'Hello!'
  }
};

describe('traverse()', function() {
  it('should \'traverse\' non-object', function(done) {
    abyss.traverse('Hello', function(v, path, cb) {
      v.should.equal('Hello');
      path.should.be.lengthOf(0);
      done();
    });
  });

  it('should iterate all properties', function(done) {
    var keyCount = 0;
    var valCount = 0;
    abyss.traverse(obj, function(v, path, cb) {
      var last = path.pop();
      keyCount += last.charCodeAt(0);
      valCount += v;
      cb();
    }, function(err) {
      if (err) done(err);
      var keys = "acdfh".split('').reduce(function(last, next) {
        return last + next.charCodeAt(0);
      }, 0);
      keyCount.should.equal(keys);
      valCount.should.equal('10Hello!');
      done();
    });
  });
});

describe('equals()', function() {
  it('should pass a weak equality check', function(done) {
    abyss.equals({b:{d:3, e:{f:4}}}, obj, function(equal) {
      equal.should.equal(true);
      done();
    });
  });

  it('should fail a weak equality check', function(done) {
    abyss.equals({b:{d:6, e:{f:4}}}, obj, function(equal) {
      equal.should.equal(false);
      done();
    });
  });

  it('should fail a mis-structured weak equality check', function(done) {
    abyss.equals({b:{d:6, u:{f:4}}}, obj, function(equal) {
      equal.should.equal(false);
      done();
    });
  });
});

describe('test()', function() {
  it('should validate non-objects (string)', function(done) {
    abyss.test(function(v) { return v === 'hello' }, 'hello', function(equal) {
      equal.should.equal(true);
      done();
    });
  });
  it('should validate non-objects (regex)', function(done) {
    abyss.test(/^..l+.$/, 'hello', function(equal) {
      equal.should.equal(true);
      done();
    });
  });
  it('should validate literal values', function(done) {
    abyss.test({a:1}, obj, function(equal) {
      equal.should.equal(true);
      done();
    });
  });
  it('should validate literal values (fail)', function(done) {
    abyss.test({a:1234}, obj, function(equal) {
      equal.should.equal(false);
      done();
    });
  });
  it('should validate with regex patterns', function(done) {
    abyss.test({a:/^\d+$/}, obj, function(equal) {
      equal.should.equal(true);
      done();
    });
  });
  it('should validate with regex patterns (fail)', function(done) {
    abyss.test({a:/^\d+asdf$/}, obj, function(equal) {
      equal.should.equal(false);
      done();
    });
  });
  it('should validate with functions', function(done) {
    abyss.test({a:function(v){return v < 5;}}, obj, function(equal) {
      equal.should.equal(true);
      done();
    });
  });
  it('should validate with functions (fail)', function(done) {
    abyss.test({a:function(v){return v > 20;}}, obj, function(equal) {
      equal.should.equal(false);
      done();
    });
  });
});

describe('clone()', function() {
  it('should clone an object', function(done) {
    abyss.clone(obj, function(err, cloned) {
      if (err) return done(err);
      cloned.should.be.an.Object();
      done();
    });
  });
  it('should first equal the original object', function(done) {
    abyss.clone(obj, function(err, cloned) {
      if (err) return done(err);
      abyss.equals(cloned, obj, function(equal) {
        equal.should.equal(true);
        done();
      });
    });
  });
  it('should now not equal the original object', function(done) {
    abyss.clone(obj, function(err, cloned) {
      if (err) return done(err);
      cloned.b.c = 1214;
      abyss.equals(cloned, obj, function(equal) {
        equal.should.equal(false);
        done();
      });
    });
  });
});

describe('transform()', function() {
  it('should transform basic literals', function(done) {
    abyss.clone(obj, function(err, cloned) {
      if (err) return done(err);
      abyss.transform({b:{c:15}}, cloned, function(err, transformed) {
        if (err) return done(err);
        abyss.equals({b:{c:15}}, transformed, function(equal) {
          equal.should.equal(true);
          done();
        });
      });
    });
  });
  it('should transform regexes', function(done) {
    abyss.clone(obj, function(err, cloned) {
      if (err) return done(err);
      abyss.transform({g:{h:[/l/gi, 'r']}}, cloned, function(err, transformed) {
        if (err) return done(err);
        abyss.equals({g:{h:'Herro!'}}, transformed, function(equal) {
          equal.should.equal(true);
          done();
        });
      });
    });
  });
  it('should transform functions', function(done) {
    abyss.clone(obj, function(err, cloned) {
      if (err) return done(err);
      var transformation = function(v) {
        return v.split('').reverse().join('');
      };
      abyss.transform({g:{h:transformation}}, cloned,
          function(err, transformed) {
            if (err) return done(err);
            abyss.equals({g:{h:'!olleH'}}, transformed, function(equal) {
              equal.should.equal(true);
              done();
            });
          });
    });
  });
  it('should ignore non-relevant transforms', function(done) {
    abyss.clone(obj, function(err, cloned) {
      if (err) return done(err);
      var transformation = function(v) {
        return v.split('').reverse().join('');
      };
      abyss.transform({g:{u:transformation}}, cloned,
          function(err, transformed) {
            if (err) return done(err);
            abyss.equals({g:{h:'Hello!'}}, transformed, function(equal) {
              equal.should.equal(true);
              done();
            });
          });
    });
  });
  it('should allow basic functional transform', function(done) {
    abyss.clone(obj, function(err, cloned) {
      if (err) return done(err);
      abyss.transform(function(){return 'bar'}, 'bar',
          function(err, transformed) {
            if (err) return done(err);
            abyss.equals('bar', transformed, function(equal) {
              equal.should.equal(true);
              done();
            });
          });
    });
  });
});
