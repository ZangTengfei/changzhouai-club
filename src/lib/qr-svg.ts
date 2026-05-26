function gfMultiply(left: number, right: number) {
  let result = 0;
  let value = left;
  let multiplier = right;

  while (multiplier > 0) {
    if ((multiplier & 1) !== 0) {
      result ^= value;
    }

    value <<= 1;
    if ((value & 0x100) !== 0) {
      value ^= 0x11d;
    }

    multiplier >>>= 1;
  }

  return result & 0xff;
}

function gfPow(value: number, power: number) {
  let result = 1;

  for (let index = 0; index < power; index += 1) {
    result = gfMultiply(result, value);
  }

  return result;
}

function reedSolomonGenerator(degree: number) {
  let generator = [1];

  for (let index = 0; index < degree; index += 1) {
    const factor = gfPow(2, index);
    const next = Array<number>(generator.length + 1).fill(0);

    for (let item = 0; item < generator.length; item += 1) {
      next[item] ^= generator[item];
      next[item + 1] ^= gfMultiply(generator[item], factor);
    }

    generator = next;
  }

  return generator.slice(1);
}

function reedSolomonRemainder(codewords: number[], degree: number) {
  const generator = reedSolomonGenerator(degree);
  const result = Array<number>(degree).fill(0);

  for (const codeword of codewords) {
    const factor = codeword ^ (result.shift() ?? 0);
    result.push(0);

    for (let index = 0; index < degree; index += 1) {
      result[index] ^= gfMultiply(generator[index], factor);
    }
  }

  return result;
}

function appendBits(target: number[], value: number, length: number) {
  for (let bit = length - 1; bit >= 0; bit -= 1) {
    target.push((value >>> bit) & 1);
  }
}

function formatBits(errorCorrectionFormatBits: number, mask: number) {
  const dataBits = (errorCorrectionFormatBits << 3) | mask;
  let remainder = dataBits;

  for (let index = 0; index < 10; index += 1) {
    remainder = (remainder << 1) ^ (((remainder >>> 9) & 1) * 0x537);
  }

  return ((dataBits << 10) | remainder) ^ 0x5412;
}

export function createQrMatrix(text: string) {
  const version = 4;
  const size = version * 4 + 17;
  const dataCodewordCount = 80;
  const errorCorrectionCodewordCount = 20;
  const mask = 0;
  const bytes = [...new TextEncoder().encode(text)];
  const bits: number[] = [];

  if (bytes.length > 78) {
    throw new Error("QR text is too long for the bundled QR encoder.");
  }

  appendBits(bits, 0b0100, 4);
  appendBits(bits, bytes.length, 8);

  for (const byte of bytes) {
    appendBits(bits, byte, 8);
  }

  const capacityBits = dataCodewordCount * 8;

  for (let index = 0; index < Math.min(4, capacityBits - bits.length); index += 1) {
    bits.push(0);
  }

  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const codewords: number[] = [];

  for (let index = 0; index < bits.length; index += 8) {
    let codeword = 0;

    for (let bit = 0; bit < 8; bit += 1) {
      codeword = (codeword << 1) | (bits[index + bit] ?? 0);
    }

    codewords.push(codeword);
  }

  for (let pad = 0xec; codewords.length < dataCodewordCount; pad ^= 0xfd) {
    codewords.push(pad);
  }

  const allCodewords = codewords.concat(reedSolomonRemainder(codewords, errorCorrectionCodewordCount));
  const dataBits: number[] = [];

  for (const codeword of allCodewords) {
    appendBits(dataBits, codeword, 8);
  }

  const modules = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const isFunction = Array.from({ length: size }, () => Array<boolean>(size).fill(false));

  function setFunction(x: number, y: number, isBlack: boolean) {
    if (x < 0 || y < 0 || x >= size || y >= size) {
      return;
    }

    modules[y][x] = isBlack;
    isFunction[y][x] = true;
  }

  function drawFinder(left: number, top: number) {
    for (let y = -1; y <= 7; y += 1) {
      for (let x = -1; x <= 7; x += 1) {
        const xx = left + x;
        const yy = top + y;
        const isOuter = x >= 0 && x <= 6 && y >= 0 && y <= 6 && (x === 0 || x === 6 || y === 0 || y === 6);
        const isCenter = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        setFunction(xx, yy, isOuter || isCenter);
      }
    }
  }

  function drawAlignment(centerX: number, centerY: number) {
    for (let y = -2; y <= 2; y += 1) {
      for (let x = -2; x <= 2; x += 1) {
        setFunction(centerX + x, centerY + y, Math.max(Math.abs(x), Math.abs(y)) !== 1);
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);
  drawAlignment(26, 26);

  for (let index = 8; index < size - 8; index += 1) {
    setFunction(6, index, index % 2 === 0);
    setFunction(index, 6, index % 2 === 0);
  }

  const bits15 = formatBits(1, mask);
  const getBit = (value: number, index: number) => ((value >>> index) & 1) !== 0;

  for (let index = 0; index <= 5; index += 1) {
    setFunction(8, index, getBit(bits15, index));
  }

  setFunction(8, 7, getBit(bits15, 6));
  setFunction(8, 8, getBit(bits15, 7));
  setFunction(7, 8, getBit(bits15, 8));

  for (let index = 9; index < 15; index += 1) {
    setFunction(14 - index, 8, getBit(bits15, index));
  }

  for (let index = 0; index < 8; index += 1) {
    setFunction(size - 1 - index, 8, getBit(bits15, index));
  }

  for (let index = 8; index < 15; index += 1) {
    setFunction(8, size - 15 + index, getBit(bits15, index));
  }

  setFunction(8, size - 8, true);

  let bitIndex = 0;
  let upward = true;

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) {
      right -= 1;
    }

    for (let vertical = 0; vertical < size; vertical += 1) {
      const y = upward ? size - 1 - vertical : vertical;

      for (let offset = 0; offset < 2; offset += 1) {
        const x = right - offset;

        if (isFunction[y][x]) {
          continue;
        }

        let isBlack = bitIndex < dataBits.length ? dataBits[bitIndex] === 1 : false;
        bitIndex += 1;

        if ((x + y) % 2 === 0) {
          isBlack = !isBlack;
        }

        modules[y][x] = isBlack;
      }
    }

    upward = !upward;
  }

  return modules;
}
