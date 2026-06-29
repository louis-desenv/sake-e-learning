const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const dirs = [
  'C:/Users/bielx/source/repos/zzz/sakae-e-learning-v3/pages', 
  'C:/Users/bielx/source/repos/zzz/sakae-e-learning-v3/components', 
  'C:/Users/bielx/source/repos/zzz/sakae-e-learning-v3/context',
  'C:/Users/bielx/source/repos/zzz/sakae-e-learning-v3/gamification'
];
const results = [];

const ignoreWords = ['div', 'span', 'class', 'className', 'Button', 'Text', 'Icon', 'Link'];

dirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    walkDir(dir, filePath => {
      if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      const matches = content.matchAll(/>([^<{]*[a-zA-Z]+[^<}]*)</g);
      for (const match of matches) {
        const text = match[1].trim();
        // Ignore lines with code-like tokens
        if (text && text.length > 2 && !ignoreWords.includes(text) && !text.includes('=>') && !text.includes('&&') && !text.includes('||')) {
          results.push({ file: filePath.replace('C:/Users/bielx/source/repos/zzz/sakae-e-learning-v3/', ''), type: 'Tag Content', text });
        }
      }
      
      const placeholders = content.matchAll(/placeholder=(["'])([^"'{]+)\1/g);
      for (const match of placeholders) {
          results.push({ file: filePath.replace('C:/Users/bielx/source/repos/zzz/sakae-e-learning-v3/', ''), type: 'Placeholder', text: match[2] });
      }

      const titles = content.matchAll(/title=(["'])([^"'{]+)\1/g);
      for (const match of titles) {
          results.push({ file: filePath.replace('C:/Users/bielx/source/repos/zzz/sakae-e-learning-v3/', ''), type: 'Title', text: match[2] });
      }

    });
  }
});

fs.writeFileSync('C:/Users/bielx/source/repos/zzz/sakae-e-learning-v3/i18n_report.json', JSON.stringify(results, null, 2));

console.log("Done");
