import { ShapFlags } from "../shared/ShapFlags";

export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");

export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children,
    shapFlag: getShapFlag(type),
    el: undefined,
  };
  //标记 children 类型
  if (typeof children === "string" || typeof children === "number") {
    vnode.shapFlag |= ShapFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children))
    vnode.shapFlag |= ShapFlags.ARRAY_CHILDREN;
  else if (typeof children === "object")
    vnode.shapFlag |= ShapFlags.SLOTS_CHILDREN;

  return vnode;
}

function getShapFlag(type) {
  return typeof type === "string"
    ? ShapFlags.ELEMENT
    : ShapFlags.STATEFUL_COMPONENT;
}

export function createTextVNode(text: string) {
  return createVNode(Text, {}, text);
}
