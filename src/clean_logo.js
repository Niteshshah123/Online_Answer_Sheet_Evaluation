const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

const table = (() => {
  let c;
  const t = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    t[n] = c;
  }
  return t;
})();

function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function processLogo() {
  const logoPath = path.join(__dirname, '..', 'public', 'uploads', 'images', 'logo.png');
  if (!fs.existsSync(logoPath)) {
    console.log('Logo not found at', logoPath);
    return;
  }
  const fileBuf = fs.readFileSync(logoPath);
  
  // Parse chunks
  let offset = 8;
  const idatChunks = [];
  let width = 0;
  let height = 0;
  let bitDepth = 8;
  let colorType = 6;
  
  while (offset < fileBuf.length) {
    const length = fileBuf.readUInt32BE(offset);
    const type = fileBuf.slice(offset + 4, offset + 8).toString('ascii');
    const data = fileBuf.slice(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    }
    offset += 12 + length;
  }

  const compressed = Buffer.concat(idatChunks);
  const decompressed = zlib.inflateSync(compressed);

  const bytesPerPixel = (colorType === 6) ? 4 : (colorType === 2 ? 3 : 4);
  const stride = width * bytesPerPixel;
  const rawData = Buffer.alloc(width * height * 4);

  let inOffset = 0;
  const prevRow = Buffer.alloc(stride, 0);
  const currentRow = Buffer.alloc(stride, 0);

  for (let y = 0; y < height; y++) {
    const filterType = decompressed[inOffset++];
    for (let x = 0; x < stride; x++) {
      const xVal = decompressed[inOffset++];
      const bpp = bytesPerPixel;
      const a = (x >= bpp) ? currentRow[x - bpp] : 0;
      const b = prevRow[x];
      const c = (x >= bpp) ? prevRow[x - bpp] : 0;

      let val = 0;
      if (filterType === 0) val = xVal;
      else if (filterType === 1) val = (xVal + a) & 0xFF;
      else if (filterType === 2) val = (xVal + b) & 0xFF;
      else if (filterType === 3) val = (xVal + Math.floor((a + b) / 2)) & 0xFF;
      else if (filterType === 4) val = (xVal + paethPredictor(a, b, c)) & 0xFF;

      currentRow[x] = val;
    }

    currentRow.copy(prevRow);

    for (let x = 0; x < width; x++) {
      const outIdx = (y * width + x) * 4;
      if (colorType === 6) {
        rawData[outIdx] = currentRow[x * 4];
        rawData[outIdx + 1] = currentRow[x * 4 + 1];
        rawData[outIdx + 2] = currentRow[x * 4 + 2];
        rawData[outIdx + 3] = currentRow[x * 4 + 3];
      } else if (colorType === 2) {
        rawData[outIdx] = currentRow[x * 3];
        rawData[outIdx + 1] = currentRow[x * 3 + 1];
        rawData[outIdx + 2] = currentRow[x * 3 + 2];
        rawData[outIdx + 3] = 255;
      }
    }
  }

  function isRedEmblem(r, g, b, a) {
    if (a < 50) return false;
    // Red/maroon emblem
    if (r > 65 && (r - g > 20) && (r - b > 10)) return true;
    if (r > 90 && g < 75 && b < 85) return true;
    return false;
  }

  function isGrayOrWhite(r, g, b) {
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    return maxDiff <= 35 && (r + g + b) / 3 > 120;
  }

  const isOutside = new Uint8Array(width * height);
  const queue = [];

  // Seed flood fill from borders & corners
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < 10; y++) {
      const pos = y * width + x;
      const idx = pos * 4;
      if (!isRedEmblem(rawData[idx], rawData[idx+1], rawData[idx+2], rawData[idx+3])) {
        if (!isOutside[pos]) { isOutside[pos] = 1; queue.push(x, y); }
      }
    }
    for (let y = height - 10; y < height; y++) {
      const pos = y * width + x;
      const idx = pos * 4;
      if (!isRedEmblem(rawData[idx], rawData[idx+1], rawData[idx+2], rawData[idx+3])) {
        if (!isOutside[pos]) { isOutside[pos] = 1; queue.push(x, y); }
      }
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < 10; x++) {
      const pos = y * width + x;
      const idx = pos * 4;
      if (!isRedEmblem(rawData[idx], rawData[idx+1], rawData[idx+2], rawData[idx+3])) {
        if (!isOutside[pos]) { isOutside[pos] = 1; queue.push(x, y); }
      }
    }
    for (let x = width - 10; x < width; x++) {
      const pos = y * width + x;
      const idx = pos * 4;
      if (!isRedEmblem(rawData[idx], rawData[idx+1], rawData[idx+2], rawData[idx+3])) {
        if (!isOutside[pos]) { isOutside[pos] = 1; queue.push(x, y); }
      }
    }
  }

  // Also seed gaps between ribbon folds if they are outside
  // (e.g. coordinates near bottom corners)
  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];

    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1]
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nPos = ny * width + nx;
        if (!isOutside[nPos]) {
          const nIdx = nPos * 4;
          const nr = rawData[nIdx];
          const ng = rawData[nIdx + 1];
          const nb = rawData[nIdx + 2];
          const na = rawData[nIdx + 3];
          if (!isRedEmblem(nr, ng, nb, na)) {
            isOutside[nPos] = 1;
            queue.push(nx, ny);
          }
        }
      }
    }
  }

  // Process all pixels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = y * width + x;
      const idx = pos * 4;
      const r = rawData[idx];
      const g = rawData[idx + 1];
      const b = rawData[idx + 2];
      const a = rawData[idx + 3];

      if (isOutside[pos]) {
        // Outside background -> completely transparent
        rawData[idx + 3] = 0;
      } else {
        // Inside emblem
        if (isRedEmblem(r, g, b, a)) {
          // Keep crisp maroon red
          rawData[idx + 3] = 255;
        } else if (isGrayOrWhite(r, g, b)) {
          // Checkerboard square inside emblem -> Turn to crisp solid pure white!
          rawData[idx] = 255;
          rawData[idx + 1] = 255;
          rawData[idx + 2] = 255;
          rawData[idx + 3] = 255;
        }
      }
    }
  }

  // Encode to PNG
  const outRows = [];
  for (let y = 0; y < height; y++) {
    outRows.push(0); // Filter 0: None
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      outRows.push(rawData[idx]);
      outRows.push(rawData[idx + 1]);
      outRows.push(rawData[idx + 2]);
      outRows.push(rawData[idx + 3]);
    }
  }

  const outDataBuffer = Buffer.from(outRows);
  const outDeflated = zlib.deflateSync(outDataBuffer, { level: 9 });

  function createChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const toCrc = Buffer.concat([typeBuf, data]);
    const crcVal = Buffer.alloc(4);
    crcVal.writeUInt32BE(crc32(toCrc), 0);
    return Buffer.concat([len, typeBuf, data, crcVal]);
  }

  const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', outDeflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  const finalPng = Buffer.concat([pngHeader, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(logoPath, finalPng);
  console.log('Successfully saved high-quality clean logo to', logoPath);
}

module.exports = { processLogo };
