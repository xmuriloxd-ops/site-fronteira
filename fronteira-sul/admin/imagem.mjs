/**
 * Reconhece uma imagem enviada pelo painel olhando o conteúdo do arquivo (o
 * nome e o tipo informados pelo navegador não são confiáveis) e lê o tamanho
 * em pixels. Aceita PNG, JPEG, WebP e GIF.
 */

function tamanhoDoJpeg(b) {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    let marca = b[i + 1];
    // bytes 0xFF de preenchimento antes da marca
    while (marca === 0xff && i + 2 < b.length) {
      i += 1;
      marca = b[i + 1];
    }
    if (marca === 0xd9 || marca === 0xda) return null; // fim da imagem ou início dos pixels
    if (marca === 0x01 || (marca >= 0xd0 && marca <= 0xd7)) {
      i += 2; // marcas sem conteúdo
      continue;
    }
    const comprimento = b.readUInt16BE(i + 2);
    if (comprimento < 2) return null;
    const quadro = marca >= 0xc0 && marca <= 0xcf && marca !== 0xc4 && marca !== 0xc8 && marca !== 0xcc;
    if (quadro) return { altura: b.readUInt16BE(i + 5), largura: b.readUInt16BE(i + 7) };
    i += 2 + comprimento;
  }
  return null;
}

function tamanhoDoWebp(b) {
  if (b.length < 30) return null;
  const formato = b.toString('latin1', 12, 16);
  if (formato === 'VP8X') return { largura: 1 + b.readUIntLE(24, 3), altura: 1 + b.readUIntLE(27, 3) };
  if (formato === 'VP8L' && b[20] === 0x2f) {
    const bits = b.readUInt32LE(21);
    return { largura: 1 + (bits & 0x3fff), altura: 1 + ((bits >>> 14) & 0x3fff) };
  }
  if (formato === 'VP8 ' && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) {
    return { largura: b.readUInt16LE(26) & 0x3fff, altura: b.readUInt16LE(28) & 0x3fff };
  }
  return null;
}

/**
 * @param {Buffer} b conteúdo do arquivo
 * @returns {{tipo: string, ext: string, largura: number, altura: number} | null} null se não for uma imagem aceita
 */
export function analisarImagem(b) {
  if (!Buffer.isBuffer(b) || b.length < 16) return null;
  let tipo = null;
  let ext = null;
  let tamanho = null;
  try {
    if (b.readUInt32BE(0) === 0x89504e47 && b.readUInt32BE(4) === 0x0d0a1a0a) {
      tipo = 'image/png';
      ext = 'png';
      if (b.length >= 24 && b.toString('latin1', 12, 16) === 'IHDR') tamanho = { largura: b.readUInt32BE(16), altura: b.readUInt32BE(20) };
    } else if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
      tipo = 'image/jpeg';
      ext = 'jpg';
      tamanho = tamanhoDoJpeg(b);
    } else if (b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') {
      tipo = 'image/webp';
      ext = 'webp';
      tamanho = tamanhoDoWebp(b);
    } else if (/^GIF8[79]a$/.test(b.toString('latin1', 0, 6))) {
      tipo = 'image/gif';
      ext = 'gif';
      tamanho = { largura: b.readUInt16LE(6), altura: b.readUInt16LE(8) };
    }
  } catch {
    tamanho = null; // arquivo cortado: o tipo vale, o tamanho fica desconhecido
  }
  if (!tipo) return null;
  const valido = tamanho && tamanho.largura > 0 && tamanho.altura > 0 && tamanho.largura <= 65535 && tamanho.altura <= 65535;
  return { tipo, ext, largura: valido ? tamanho.largura : 0, altura: valido ? tamanho.altura : 0 };
}
