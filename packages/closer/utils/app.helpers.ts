interface InputObject {
  [key: string]: {
    label: string;
    value: string | number;
  };
}
export function prepareGeneralConfig(
  inputObj: InputObject,
): Record<string, string> {
    const result: Record<string, string> = {};

  Object.entries(inputObj).forEach(([key, value]) => {
    const words = key.split(/(?=[A-Z])/).map(word => word.toUpperCase());
    const upperCaseKey = words.join('_');
    result[upperCaseKey] = String(value.value);
  });

  return result;
}
