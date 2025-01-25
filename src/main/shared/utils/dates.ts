export function getFullDateISOFormat(): String { return new Date().toISOString(); }
export function getShortDate(): String { return getFullDateISOFormat().slice(0, 10); }