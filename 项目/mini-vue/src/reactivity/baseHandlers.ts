import { isObject } from "../shared/index";
import { track, trigger } from "./effect";
import { reactive, ReactiveFlags, readonly } from "./reactive";

const get = createGetter();
const set = createSetter();

const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

export function createGetter(isReadonly = false, shallow = false) {
  return function (target, propName: string | symbol) {
    if (propName === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    }
    if (propName === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }

    if (!isReadonly) track(target, propName);

    const res = Reflect.get(target, propName);

    if (shallow) {
      return res;
    }

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }
    return res;
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

export const shallowReadonlyHandler = {
  get: shallowReadonlyGet,
  set: readonlyHandler.set,
};
