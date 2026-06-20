const fs = require('fs');
const buffer = fs.readFileSync('public/logo.png');
let count = 0;
for(let i=0; i<buffer.length - 2; i++){
  if(buffer[i] === 0xef && buffer[i+1] === 0xbf && buffer[i+2] === 0xbd) {
    count++;
  }
}
console.log('Number of corrupted bytes:', count);
