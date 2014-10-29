var fs = require('fs');
var assert = require('assert');
var mkdirp = require('mkdirp');
var tmp = require('tmp');
var watch = require('..');

function randomWriteTo(file, msec) {
  setTimeout(function() {
    fs.writeFileSync(file, 'some content');
  }, msec || 0);
}

function createFileUnder(dir, fn) {
  tmp.tmpName({ template: dir + '/tmp-XXXXXX' }, function(err, path) {
    if (err) throw err;
    fn(path)
  });
}

function createDirUnder(dir, fn) {
  tmp.dir({ template: dir + '/tmp-XXXXXX' }, function(err, path) {
    if (err) throw err;
    fn(path)
  });
}

describe('detect changes', function() {
  var watchdir;

  beforeEach(function(done) {
    tmp.dir(function(err, dir) {
      if (err) return done(err);
      watchdir = dir;
      setTimeout(done, 1e3);
    });
  });
 
  it('should detect the file change of itself and keep watching', function(done) {
    tmp.file(function(err, tmpfile) {
      var times = 1;
      watch(tmpfile, function(changed) {
        assert.equal(tmpfile, changed)
        if (times++ >= 3) {
          done();
        }
      });
      randomWriteTo(tmpfile);        
      randomWriteTo(tmpfile, 150);        
      randomWriteTo(tmpfile, 300);        
    });
  });   

  it('should detect file change inside a folder', function(done) {
    var tmpfile;
    watch(watchdir, function(changed) {
      assert.equal(tmpfile, changed)
      done();
    });

    createFileUnder(watchdir, function(file) {
      tmpfile = file;
      randomWriteTo(file);
    });
  });    

  it('should watch new created folder', function(done) {
    var tmpfile, tmpdir;
    watch(watchdir, function(changed) {
      if (tmpdir != changed) {
        assert.equal(tmpfile, changed)
        done();
      }
    });

    createDirUnder(watchdir, function(dir) {
      tmpdir = dir;
      createFileUnder(tmpdir, function(file) {
        tmpfile = file;
        randomWriteTo(file, 120);
      }); 
    });
  });    

});
