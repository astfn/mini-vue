import { createComponentInstance, setupComponent } from "./component";
import { h } from "./h";

export function render(vnode, container) {
  //调用 patch 对虚拟节点进行具体处理
  patch(vnode, container);
}

function patch(vnode, container) {
  // 根据 vnode 的类型，来决定是处理 component 还是 element
  // 目前先实现 processComponent 用于处理 component
  processComponent(vnode, container);
}

function processComponent(vnode, container) {
  /**
   * 主要逻辑有：挂载组件、更新组件
   */
  //初始化流程，目前只关注挂载组件过程
  mountComponent(vnode, container);
}

function mountComponent(vnode, container) {
  /**
   * 创建组件实例
   * 对组件实例进行初始化设置
   */
  const instance = createComponentInstance(vnode);
  setupComponent(instance);
  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance, container) {
  const subTree = instance.render(h);
  patch(subTree, container);
}
