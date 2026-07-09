/** Empty is valid (colors are optional); otherwise require #RGB or #RRGGBB. */
export function isValidHexColor(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed);
}
