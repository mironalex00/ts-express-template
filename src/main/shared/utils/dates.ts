export function getFullDateISOFormat(): string {
  return new Date().toISOString();
}
export function getShortDate(): string {
  return getFullDateISOFormat().slice(0, 10);
}
