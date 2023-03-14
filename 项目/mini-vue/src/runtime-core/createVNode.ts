import { isObject } from "../shared/index";
import { ShapFlags } from "../shared/ShapFlags";

export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children,
    shapFlag: getShapFlag(type),
    el: undefined,
  };
  //标记 children 类型
  if (typeof children === "string") vnode.shapFlag |= ShapFlags.TEXT_CHILDREN;
  if (Array.isArray(children)) vnode.shapFlag |= ShapFlags.ARRAY_CHILDREN;

  return vnode;
}

function getShapFlag(type) {
  return typeof type === "string"
    ? ShapFlags.ELEMENT
    : ShapFlags.STATEFUL_COMPONENT;
}
