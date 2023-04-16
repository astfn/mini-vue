import { isObject } from "../shared/index";
import { ShapFlags } from "../shared/ShapFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { h } from "./h";
import { Fragment, Text } from "./vnode";

export function createRenderer(options) {
  const { createElement, patchProps, insert } = options;

  function render(vnode, container, parentComponent) {
    //调用 patch 对虚拟节点进行具体处理
    patch(vnode, container, parentComponent);
  }

  function patch(vnode, container, parentComponent) {
    const { type, shapFlag } = vnode;
    switch (type) {
      case Fragment: {
        procescsFragment(vnode, container, parentComponent);
        break;
      }
      case Text: {
        procescsText(vnode, container);
        break;
      }
      default: {
        // 根据 vnode 的类型，来决定是处理 component 还是 element
        if (shapFlag & ShapFlags.ELEMENT) {
          procescsElement(vnode, container, parentComponent);
        } else if (shapFlag & ShapFlags.STATEFUL_COMPONENT) {
          processComponent(vnode, container, parentComponent);
        }
      }
    }
  }

  function procescsText(vnode, container) {
    const el = (vnode.el = document.createTextNode(vnode.children));
    container.appendChild(el);
  }

  function procescsFragment(vnode, container, parentComponent) {
    mountChildren(vnode, container, parentComponent);
  }

  function procescsElement(vnode, container, parentComponent) {
    /**
     * 主要逻辑有：挂载、更新
     */
    //初始化流程，目前只关注挂载过程
    mountElement(vnode, container, parentComponent);
  }

  function mountElement(vnode, container, parentComponent) {
    // const el = (vnode.el = document.createElement(vnode.type));
    const el = (vnode.el = createElement(vnode.type));
    const { children, props, shapFlag } = vnode;

    //props
    Object.entries(props).forEach(([key, value]) => {
      // if (isOn(key)) {
      //   const event = key.slice(2).toLocaleLowerCase();
      //   el.addEventListener(event, value);
      // } else {
      //   el.setAttribute(key, value);
      // }
      patchProps(el, key, value);
    });

    //children
    if (shapFlag & ShapFlags.TEXT_CHILDREN) {
      el.innerText = children;
    } else if (shapFlag & ShapFlags.ARRAY_CHILDREN) {
      mountChildren(vnode, el, parentComponent);
    }

    // container.appendChild(el);
    insert(el, container);
  }

  function mountChildren(vnode, container, parentComponent) {
    for (const vnodeItem of vnode.children) {
      patch(vnodeItem, container, parentComponent);
    }
  }

  function processComponent(vnode, container, parentComponent) {
    /**
     * 主要逻辑有：挂载组件、更新组件
     */
    //初始化流程，目前只关注挂载组件过程
    mountComponent(vnode, container, parentComponent);
  }

  function mountComponent(initialVnode, container, parentComponent) {
    /**
     * 创建组件实例
     * 对组件实例进行初始化设置
     */
    const instance = createComponentInstance(initialVnode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container, instance);
  }

  function setupRenderEffect(
    instance,
    initialVnode,
    container,
    parentComponent
  ) {
    const subTree = instance.render.call(instance.proxy, h);
    patch(subTree, container, parentComponent);
    initialVnode.el = subTree.el;
  }

  return {
    createApp: createAppAPI(render),
  };
}
