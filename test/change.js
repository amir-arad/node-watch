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
      done();
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

  it('should watch recursively', function(done) {
    var tmpfile; 
    var tmpdir = [];
    watch(watchdir, function(changed) {
      if (tmpdir.indexOf(changed) == -1) {
        assert.equal(tmpfile, changed)
        done();
      }
    });

    createDirUnder(watchdir, function(dir) {
      tmpdir.push(dir);
      createDirUnder(dir, function(sdir) {
        tmpdir.push(sdir);
        createFileUnder(sdir, function(file) {
          tmpfile = file;
          randomWriteTo(file, 120);
        }); 
      });
    });
  });    

  it('should ignore symblic link by default', function(done) {
    var tmpfile;
    var link = watchdir + '-link';
    fs.symlinkSync(watchdir, link, 'dir');
    watch(link, function(changed) {
      assert(false);
    });

    createFileUnder(link, function(file) {
      tmpfile = file;
      randomWriteTo(file);
    }); 
    setTimeout(done, 200);
  });     

  it('should follow symblic link with option', function(done) {
    var tmpfile;
    var link = watchdir + '-link';
    fs.symlinkSync(watchdir, link, 'dir');
    watch(link, {followSymLinks: true}, function(changed) {
      assert.equal(tmpfile, changed)
      done();
    });

    createFileUnder(link, function(file) {
      tmpfile = file;
      randomWriteTo(file);
    }); 
  });       

});
