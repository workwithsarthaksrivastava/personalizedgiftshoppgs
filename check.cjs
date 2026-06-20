const fs = require('fs');
const stats = fs.statSync('public/logo.png');
console.log('File size:', stats.size);
