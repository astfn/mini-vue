import { track, trigger } from "./effect";

function createGetter(target, propName: string | symbol) {
  track(target, propName);
  return Reflect.get(target, propName);
}

function createSetter(target, propName: string | symbol, newValue) {
  const res = Reflect.set(target, propName, newValue);
  trigger(target, propName);
  return res;
}

export function reactive(raw) {
  return new Proxy(raw, {
    get: createGetter,
    set: createSetter,
  });
}
