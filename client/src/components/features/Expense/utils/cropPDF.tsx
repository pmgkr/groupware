function cropHalfCanvas(source: HTMLCanvasElement, x: number, width: number) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = width;
  canvas.height = source.height;

  ctx.drawImage(source, x, 0, width, source.height, 0, 0, width, source.height);

  return canvas;
}

function cropWhitespace(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;

  let top = height;
  let bottom = 0;
  let left = width;
  let right = 0;

  const isInk = (idx: number) => {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];
    return a > 0 && (r < 245 || g < 245 || b < 245);
  };

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4;
      if (isInk(idx)) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }

  const padding = 16;
  top = Math.max(top - padding, 0);
  left = Math.max(left - padding, 0);
  bottom = Math.min(bottom + padding, height);
  right = Math.min(right + padding, width);

  const out = document.createElement('canvas');
  out.width = right - left;
  out.height = bottom - top;

  out.getContext('2d')!.drawImage(canvas, left, top, out.width, out.height, 0, 0, out.width, out.height);

  return out;
}

export { cropHalfCanvas, cropWhitespace };
