import { isObject } from "../shared/index";
import { createVNode } from "./vnode";
import { render } from "./renderer";

export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      //1. 先将组件统一转化为 vnode，后续都会基于 vnode 进行各种操作
      //2. 创建组件实例，并 render
      const vnode = createVNode(rootComponent);
      const targetRootContainer = getRootContainer(rootContainer);
      render(vnode, targetRootContainer, null);
    },
  };
}

function getRootContainer(rootContainer) {
  if (typeof rootContainer === "string") {
    return document.querySelector(rootContainer);
  } else if (isObject(rootContainer)) {
    return rootContainer;
  }
}
