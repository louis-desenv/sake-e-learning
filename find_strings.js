const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const dirs = ['pages', 'components', 'context', 'gamification'];
const results = [];

dirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    walkDir(dir, filePath => {
      if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Basic check for things that might be hardcoded English/Portuguese
      // This is a naive regex but helps spot un-translated stuff
      // We look for text between > and < that contains letters
      const matches = content.matchAll(/>([^<{]*[a-zA-Z]+[^<}]*)</g);
      for (const match of matches) {
        const text = match[1].trim();
        if (text && !text.includes('=>') && text.length > 2 && text !== 'div' && text !== 'span') {
          results.push({ file: filePath, type: 'Tag Content', text });
        }
      }
      
      // Look for placeholders
      const placeholders = content.matchAll(/placeholder=(["'])([^"'{]+)\1/g);
      for (const match of placeholders) {
          results.push({ file: filePath, type: 'Placeholder', text: match[2] });
      }

      // Look for titles
      const titles = content.matchAll(/title=(["'])([^"'{]+)\1/g);
      for (const match of titles) {
          results.push({ file: filePath, type: 'Title', text: match[2] });
      }
      
      // Look for plain string alerts or errors
      const alerts = content.matchAll(/alert\((["'])([^"']+)\1\)/g);
      for (const match of alerts) {
          results.push({ file: filePath, type: 'Alert', text: match[2] });
      }
    });
  }
});

console.log(JSON.stringify(results, null, 2));
