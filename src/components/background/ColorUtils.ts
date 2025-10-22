export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return [0, 0, 0];
  }

  return [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  ];
}

export function cssColorToRgb(cssColor: string): [number, number, number] {
  if (cssColor.startsWith('#')) {
    return hexToRgb(cssColor);
  }

  const result = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/i.exec(cssColor);
  if (!result) {
    return [0, 0, 0];
  }

  return [
    parseInt(result[1], 10) / 255,
    parseInt(result[2], 10) / 255,
    parseInt(result[3], 10) / 255,
  ];
}
