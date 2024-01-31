interface InputObject {
  [key: string]: {
    label: string;
    value: string | number;
  };
}
export function prepareGeneralConfig(
  inputObj: InputObject | any,
): Record<string, string> | null {
  if (!inputObj) return null;

  const result: Record<string, string> = {};

  Object.entries(inputObj).forEach(([key, value]) => {
    const words = key.split(/(?=[A-Z])/).map((word) => word.toUpperCase());
    const upperCaseKey = words.join('_');
    result[upperCaseKey] = String(value);
  });

  return result;
}
