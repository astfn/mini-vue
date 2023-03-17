import { isObject } from "../shared/index";
import { ShapFlags } from "../shared/ShapFlags";
import { createComponentInstance, setupComponent } from "./component";
import { h } from "./h";

export function render(vnode, container) {
  //调用 patch 对虚拟节点进行具体处理
  patch(vnode, container);
}

function patch(vnode, container) {
  const { shapFlag } = vnode;
  // 根据 vnode 的类型，来决定是处理 component 还是 element
  if (shapFlag & ShapFlags.ELEMENT) {
    procescsElement(vnode, container);
  } else if (shapFlag & ShapFlags.STATEFUL_COMPONENT) {
    processComponent(vnode, container);
  }
}

function procescsElement(vnode, container) {
  /**
   * 主要逻辑有：挂载、更新
   */
  //初始化流程，目前只关注挂载过程
  mountElement(vnode, container);
}

function mountElement(vnode, container) {
  const el = (vnode.el = document.createElement(vnode.type));
  const { children, props, shapFlag } = vnode;

  //props
  const isOn = (key: string) => /^on[A-Z]/.test(key);
  Object.entries(props).forEach(([key, value]) => {
    if (isOn(key)) {
      const event = key.slice(2).toLocaleLowerCase();
      el.addEventListener(event, value);
    } else {
      el.setAttribute(key, value);
    }
  });

  //children
  if (shapFlag & ShapFlags.TEXT_CHILDREN) {
    el.innerText = children;
  } else if (shapFlag & ShapFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, el);
  }

  container.appendChild(el);
}

function mountChildren(vnode, container) {
  for (const vnodeItem of vnode.children) {
    patch(vnodeItem, container);
  }
}

function processComponent(vnode, container) {
  /**
   * 主要逻辑有：挂载组件、更新组件
   */
  //初始化流程，目前只关注挂载组件过程
  mountComponent(vnode, container);
}

function mountComponent(initialVnode, container) {
  /**
   * 创建组件实例
   * 对组件实例进行初始化设置
   */
  const instance = createComponentInstance(initialVnode);
  setupComponent(instance);
  setupRenderEffect(instance, initialVnode, container);
}

function setupRenderEffect(instance, initialVnode, container) {
  const subTree = instance.render.call(instance.proxy, h);
  patch(subTree, container);
  initialVnode.el = subTree.el;
}
