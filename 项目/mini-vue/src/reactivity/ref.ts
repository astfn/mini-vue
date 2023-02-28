import { hasChanged, isObject } from "../shared";
import { track, trigger } from "./effect";
import { reactive } from "./reactive";

class RefImpl {
  #_value;
  #rawValue;
  __v_isRef = true;
  constructor(value) {
    this.#rawValue = value;
    this.#_value = convert(value);
  }
  get value() {
    track(this, "value");
    return this.#_value;
  }
  set value(newValue) {
    if (hasChanged(newValue, this.#rawValue)) {
      this.#rawValue = newValue;
      this.#_value = convert(newValue);
      trigger(this, "value");
    }
  }
}

function convert(newValue) {
  return isObject(newValue) ? reactive(newValue) : newValue;
}

export function ref(raw) {
  return new RefImpl(raw);
}

export function isRef(value) {
  return !!value?.__v_isRef;
}

export function unRef(value) {
  return isRef(value) ? value.value : value;
}

export function proxyRefs(target) {
  return new Proxy(target, {
    get(target, key) {
      return unRef(Reflect.get(target, key));
    },
    set(target, key, newValue) {
      if (isRef(target[key]) && !isRef(newValue)) {
        return Reflect.set(target[key], "value", newValue);
      } else {
        return Reflect.set(target, key, newValue);
      }
    },
  });
}
