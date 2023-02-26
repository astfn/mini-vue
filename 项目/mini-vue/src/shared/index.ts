export const extend = Object.assign;

export function isObject(target) {
  return target !== null && typeof target === "object";
}

export function hasChanged(newValue, oldValue) {
  return !Object.is(newValue, oldValue);
  // newValue===oldValue && !isNaN(newValue) && !isNaN(newValue)
}
