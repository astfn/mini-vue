import { track, trigger } from "./effect";

const get = createGetter();
const set = createSetter();

const readonlyGet = createGetter(true);

export function createGetter(isReadonly = false) {
  return function (target, propName: string | symbol) {
    if (!isReadonly) track(target, propName);
    return Reflect.get(target, propName);
  };
}

export function createSetter() {
  return function (target, propName: string | symbol, newValue) {
    const res = Reflect.set(target, propName, newValue);
    trigger(target, propName);
    return res;
  };
}

export const mutableHandler = {
  get,
  set,
};

export const readonlyHandler = {
  get: readonlyGet,
  set(_target, propName, _newValue) {
    console.warn(`key:${String(propName)} set 失败,因为target 是 readonly`);
    return true;
  },
};
