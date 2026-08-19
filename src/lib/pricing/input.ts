/**
 * input.ts (Calculadora de precios)
 * Los campos numéricos de la calculadora nunca asumen 0 cuando están vacíos (spec §24: "no
 * convertir datos obligatorios faltantes en cero") — se guardan como `number | null`, y este es el
 * único parser que traduce el string crudo del `<input>` a ese tipo, reutilizado por todas las
 * filas/secciones en vez de repetir `=== '' ? null : Number(...)` en cada componente.
 */
export function parseNumberInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}
