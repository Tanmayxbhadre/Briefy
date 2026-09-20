/* eslint-disable */
const fs = require('fs');
const path = require('path');

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let i = 0;
    (function next() {
      let file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('.next')) {
            walk(file, function(err, res) {
              results = results.concat(res);
              next();
            });
          } else {
            next();
          }
        } else {
          if (file.match(/\.(ts|tsx|js|jsx|md|css|prisma|json)$/)) {
            results.push(file);
          }
          next();
        }
      });
    })();
  });
}

walk('./', function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replacements
    content = content.replace(/BRIEFY/g, 'BRIEFY');
    content = content.replace(/Briefy/g, 'Briefy');
    content = content.replace(/Briefy/g, 'Briefy');
    content = content.replace(/BRIEFYLIVE/g, 'BRIEFYLIVE');
    content = content.replace(/briefylive/g, 'briefylive');
    content = content.replace(/briefylive/g, 'briefylive');
    content = content.replace(/briefylive/g, 'briefylive');

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated', file);
    }
  });
});
