export const extend = Object.assign;

export function isObject(target) {
  return target !== null && typeof target === "object";
}

export function hasChanged(newValue, oldValue) {
  return !Object.is(newValue, oldValue);
  // newValue===oldValue && !isNaN(newValue) && !isNaN(newValue)
}

export function hasOwn(target, key) {
  return Object.prototype.hasOwnProperty.call(target, key);
}
