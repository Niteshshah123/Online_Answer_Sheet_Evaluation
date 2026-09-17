const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const inputPath = path.join(__dirname, '..', 'public', 'uploads', 'images', 'logo.png');
const buf = fs.readFileSync(inputPath);

console.log('File size:', buf.length);
console.log('Header:', buf.slice(0, 8).toString('hex'));

// Parse chunks
let offset = 8;
const chunks = [];
while (offset < buf.length) {
  const length = buf.readUInt32BE(offset);
  const type = buf.slice(offset + 4, offset + 8).toString('ascii');
  const data = buf.slice(offset + 8, offset + 8 + length);
  const crc = buf.readUInt32BE(offset + 8 + length);
  chunks.push({ type, length, data, crc });
  offset += 12 + length;
}

console.log('Chunks:', chunks.map(c => c.type));
const ihdr = chunks.find(c => c.type === 'IHDR');
const width = ihdr.data.readUInt32BE(0);
const height = ihdr.data.readUInt32BE(4);
const bitDepth = ihdr.data[8];
const colorType = ihdr.data[9];
console.log({ width, height, bitDepth, colorType });
