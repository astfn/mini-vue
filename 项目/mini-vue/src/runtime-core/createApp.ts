import { createVNode } from "./createVNode";
import { render } from "./renderer";

export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      //1. 先将组件统一转化为 vnode，后续都会基于 vnode 进行各种操作
      //2. 创建组件实例，并 render
      const vnode = createVNode(rootComponent);
      render(vnode, rootContainer);
    },
  };
}
