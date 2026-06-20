import { Jimp } from 'jimp';
import fs from 'fs';

async function process() {
  try {
    const image = await Jimp.read('public/logo.png');
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      // If pixel is sufficiently white, make it transparent
      if (red > 230 && green > 230 && blue > 230) {
        this.bitmap.data[idx + 3] = 0; // alpha channel
      }
    });

    const buffer = await image.getBuffer('image/png');
    fs.writeFileSync('public/logo.png', buffer);
    fs.writeFileSync('src/assets/logo.png', buffer);
    console.log('Background removed and saved!');
  } catch (err) {
    console.error('Error:', err);
  }
}

process();
