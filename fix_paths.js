const fs = require('fs');
const path = require('path');
const dir = fs.readdirSync('.');
for (const file of dir) {
  if (file.includes('\\\\')) {
    const newPath = file.replace(/\\\\/g, '/');
    const folder = path.dirname(newPath);
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    if (fs.existsSync(newPath)) {
      fs.unlinkSync(newPath);
    }
    fs.renameSync(file, newPath);
    console.log('Moved ' + file + ' to ' + newPath);
  }
}
