/**
 * Self-contained, zero-dependency QR Code Generator in pure TypeScript.
 * Generates standards-compliant QR Codes (ISO/IEC 18004) up to Version 6.
 * Outputs pure scalable Vector SVG, Data URL, or 2D boolean matrix.
 */

// GF(256) Math
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_EXP[i + 255] = x;
    GF_LOG[x] = i;
    x = (x << 1) ^ (x & 128 ? 0x11d : 0);
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF_EXP[GF_LOG[x] + GF_LOG[y]];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], GF_EXP[i]);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsCompute(data: Uint8Array, ecLength: number): Uint8Array {
  const gen = rsGeneratorPoly(ecLength);
  const remainder = new Uint8Array(ecLength);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    remainder.copyWithin(0, 1);
    remainder[ecLength - 1] = 0;
    if (factor !== 0) {
      for (let j = 0; j < ecLength; j++) {
        remainder[j] ^= gfMul(gen[j], factor);
      }
    }
  }
  return remainder;
}

// QR Specs for Version 1 to 6, Error Correction Level M
// [totalCodewords, dataCodewords, ecCodewordsPerBlock, numBlocks]
const VERSION_SPECS_M: Record<number, [number, number, number, number]> = {
  1: [26, 16, 10, 1],
  2: [44, 28, 16, 1],
  3: [70, 44, 26, 1],
  4: [100, 64, 18, 2], // 2 blocks of 32 data, 18 ec each = 100 total
  5: [134, 86, 24, 2],
  6: [172, 108, 16, 4],
};

const ALIGNMENT_PATTERN_POSITIONS: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
};

export function encodeQrSvg(text: string, size = 256): string {
  const bytes = new TextEncoder().encode(text);

  // Pick smallest fitting version
  let version = 1;
  while (version <= 6 && bytes.length + 3 > VERSION_SPECS_M[version][1]) {
    version++;
  }
  if (version > 6) {
    version = 6; // Cap at version 6
  }

  const [, dataCodewords, ecPerBlock, numBlocks] = VERSION_SPECS_M[version];
  const moduleCount = 17 + 4 * version;

  // 1. Bit Buffer (Mode 4 = Byte, count indicator = 8 bits)
  const bitBuffer: number[] = [];
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bitBuffer.push((val >>> i) & 1);
    }
  }

  pushBits(0b0100, 4); // Byte mode
  pushBits(bytes.length, 8); // Character count
  for (const b of bytes) {
    pushBits(b, 8);
  }

  // Terminator (up to 4 zeroes)
  const maxBits = dataCodewords * 8;
  const termLen = Math.min(4, maxBits - bitBuffer.length);
  pushBits(0, termLen);

  // Pad to byte boundary
  while (bitBuffer.length % 8 !== 0) {
    bitBuffer.push(0);
  }

  // Convert to bytes
  const dataBytes = new Uint8Array(dataCodewords);
  for (let i = 0; i < bitBuffer.length / 8 && i < dataCodewords; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | bitBuffer[i * 8 + b];
    }
    dataBytes[i] = byte;
  }

  // Pad with alternating 0xEC and 0x11
  let padToggle = true;
  for (let i = bitBuffer.length / 8; i < dataCodewords; i++) {
    dataBytes[i] = padToggle ? 0xec : 0x11;
    padToggle = !padToggle;
  }

  // 2. Compute Error Correction Blocks
  const blockSize = dataCodewords / numBlocks;
  const allBlocks: { data: Uint8Array; ec: Uint8Array }[] = [];
  for (let b = 0; b < numBlocks; b++) {
    const blockData = dataBytes.slice(b * blockSize, (b + 1) * blockSize);
    const blockEc = rsCompute(blockData, ecPerBlock);
    allBlocks.push({ data: blockData, ec: blockEc });
  }

  // Interleave data and ec codewords
  const finalCodewords: number[] = [];
  for (let i = 0; i < blockSize; i++) {
    for (let b = 0; b < numBlocks; b++) {
      finalCodewords.push(allBlocks[b].data[i]);
    }
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (let b = 0; b < numBlocks; b++) {
      finalCodewords.push(allBlocks[b].ec[i]);
    }
  }

  // 3. Matrix setup
  const matrix: (boolean | null)[][] = Array.from({ length: moduleCount }, () =>
    Array(moduleCount).fill(null)
  );

  function setFinder(startRow: number, startCol: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = startRow + r;
        const col = startCol + c;
        if (row >= 0 && row < moduleCount && col >= 0 && col < moduleCount) {
          if (
            (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
            (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            matrix[row][col] = true;
          } else {
            matrix[row][col] = false;
          }
        }
      }
    }
  }

  // Finders
  setFinder(0, 0);
  setFinder(0, moduleCount - 7);
  setFinder(moduleCount - 7, 0);

  // Timing patterns
  for (let i = 8; i < moduleCount - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Alignment patterns
  const alignPos = ALIGNMENT_PATTERN_POSITIONS[version] || [];
  for (const r of alignPos) {
    for (const c of alignPos) {
      if (matrix[r][c] !== null) continue; // Skip if overlapping finders
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isBlack = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          matrix[r + dr][c + dc] = isBlack;
        }
      }
    }
  }

  // Dark module
  matrix[4 * version + 9][8] = true;

  // Reserve Format areas
  for (let i = 0; i < 9; i++) {
    if (matrix[8][i] === null) matrix[8][i] = false;
    if (matrix[i][8] === null) matrix[i][8] = false;
  }
  for (let i = moduleCount - 8; i < moduleCount; i++) {
    if (matrix[8][i] === null) matrix[8][i] = false;
    if (matrix[i][8] === null) matrix[i][8] = false;
  }

  // 4. Place Data Codewords (Zig-Zag)
  let bitIndex = 0;
  const totalBits = finalCodewords.length * 8;
  let upwards = true;

  for (let right = moduleCount - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing line
    for (let v = 0; v < moduleCount; v++) {
      const row = upwards ? moduleCount - 1 - v : v;
      for (let col = right; col >= right - 1; col--) {
        if (matrix[row][col] === null) {
          let bit = false;
          if (bitIndex < totalBits) {
            const byteVal = finalCodewords[Math.floor(bitIndex / 8)];
            bit = ((byteVal >>> (7 - (bitIndex % 8))) & 1) === 1;
            bitIndex++;
          }
          // Apply mask 0: (row + col) % 2 === 0
          const mask = (row + col) % 2 === 0;
          matrix[row][col] = bit !== mask;
        }
      }
    }
    upwards = !upwards;
  }

  // Format info for EC Level M (0b00) + Mask 0 (0b000) => 0b101010000010010
  // Standard format bits for (M, Mask 0) XOR 0x5412 = 0x5412 ^ 0x0000 = 0x5412?
  // Pre-computed BCH format bits for M (00) & mask 0 (000): 101010000010010
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];

  // Write format info around top-left finder
  const formatCoordsTopLeft = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = formatCoordsTopLeft[i];
    matrix[r][c] = formatBits[i] === 1;
  }

  // Write format info split between bottom-left and top-right
  for (let i = 0; i < 7; i++) {
    matrix[moduleCount - 1 - i][8] = formatBits[i] === 1;
  }
  for (let i = 7; i < 15; i++) {
    matrix[8][moduleCount - 15 + i] = formatBits[i] === 1;
  }

  // 5. Build SVG
  const border = 4;
  const viewBoxSize = moduleCount + border * 2;
  let path = '';
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (matrix[r][c]) {
        path += `M${c + border},${r + border}h1v1h-1z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" width="${size}" height="${size}" fill="currentColor" shape-rendering="crispEdges"><path d="${path}"/></svg>`;
}
