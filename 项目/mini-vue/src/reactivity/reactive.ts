import { isObject } from "../shared/index";
import {
  mutableHandler,
  readonlyHandler,
  shallowReadonlyHandler,
} from "./baseHandlers";

export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
}

function createActiveObject(target, baseHandler) {
  if (!isObject(target)) {
    console.error(`target: ${target} 必须是一个对象`);
    return target;
  }
  return new Proxy(target, baseHandler);
}

export function reactive(raw) {
  return createActiveObject(raw, mutableHandler);
}

export function readonly(raw) {
  return createActiveObject(raw, readonlyHandler);
}

export function shallowReadonly(raw) {
  return createActiveObject(raw, shallowReadonlyHandler);
}

export function isReactive(value): boolean {
  return !!(value && value[ReactiveFlags.IS_REACTIVE]);
}

export function isReadonly(value): boolean {
  return !!(value && value[ReactiveFlags.IS_READONLY]);
}

export function isProxy(value): boolean {
  return isReactive(value) || isReadonly(value);
}
