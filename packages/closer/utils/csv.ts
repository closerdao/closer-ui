const CSV_FORMULA_TRIGGER = /^[=+\-@\t\r]/;

export const csvCell = (value: unknown): string => {
  let str = value == null ? '' : String(value);
  if (
    CSV_FORMULA_TRIGGER.test(str) ||
    CSV_FORMULA_TRIGGER.test(str.trimStart())
  ) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
};
