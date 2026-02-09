export function formatKilometers(value: number): string {
  const rounded = Math.max(0, Math.round(value));
  return new Intl.NumberFormat("en-US").format(rounded) + " km";
}
