import { effect } from "../reactivity";
import { isObject } from "../shared/index";
import { ShapFlags } from "../shared/ShapFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { h } from "./h";
import { Fragment, Text } from "./vnode";

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProps: hostPatchProps,
    insert: hostInsert,
  } = options;

  function render(vnode, container, parentComponent) {
    //调用 patch 对虚拟节点进行具体处理
    patch(null, vnode, container, parentComponent);
  }

  /**
   * n1: old vnode tree
   * n2: new vnode tree
   */
  function patch(n1, n2, container, parentComponent) {
    const { type, shapFlag } = n2;
    switch (type) {
      case Fragment: {
        procescsFragment(n1, n2, container, parentComponent);
        break;
      }
      case Text: {
        procescsText(n1, n2, container);
        break;
      }
      default: {
        // 根据 vnode 的类型，来决定是处理 component 还是 element
        if (shapFlag & ShapFlags.ELEMENT) {
          procescsElement(n1, n2, container, parentComponent);
        } else if (shapFlag & ShapFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent);
        }
      }
    }
  }

  function procescsText(n1, n2, container) {
    const el = (n2.el = document.createTextNode(n2.children));
    container.appendChild(el);
  }

  function procescsFragment(n1, n2, container, parentComponent) {
    mountChildren(n2, container, parentComponent);
  }

  function procescsElement(n1, n2, container, parentComponent) {
    /**
     * 主要逻辑有：挂载、更新
     */
    if (!n1) {
      mountElement(n2, container, parentComponent);
    } else {
      patchElement(n1, n2, container, parentComponent);
    }
  }

  function mountElement(vnode, container, parentComponent) {
    // const el = (vnode.el = document.createElement(vnode.type));
    const el = (vnode.el = hostCreateElement(vnode.type));
    const { children, props, shapFlag } = vnode;

    //props
    Object.entries(props).forEach(([key, value]) => {
      hostPatchProps(el, key, null, value);
    });

    //children
    if (shapFlag & ShapFlags.TEXT_CHILDREN) {
      el.innerText = children;
    } else if (shapFlag & ShapFlags.ARRAY_CHILDREN) {
      mountChildren(vnode, el, parentComponent);
    }

    hostInsert(el, container);
  }

  function patchElement(n1, n2, container, parentComponent) {
    console.log("patchElement");
    console.log("current tree", n2);
    console.log("prev tree", n1);

    const el = (n2.el = n1.el);

    const oldProps = n1.props;
    const newProps = n2.props;
    patchProps(el, oldProps, newProps);
  }

  function patchProps(el, oldProps, newProps) {
    /**
     * 以 newProps 为基础, 检索 oldProps, 处理以下 case
     * 1. newProps 与 oldProps 都存在某个 key, 且值不一样 (进行 patch)
     * 2. newProps 中存在某个 key, 但 oldProps 中不存在 (进行 add)
     */
    Object.entries(newProps).forEach(([key, nextProp]) => {
      const prevProp = oldProps[key];
      if (prevProp !== nextProp) hostPatchProps(el, key, prevProp, nextProp);
    });
    /**
     * 以 oldProps 为基础, 检索 newProps, 处理以下 case
     * 1. oldProps 中的某个 key, 在 newProps 中不存在了 (delete)
     */
    Object.entries(oldProps).forEach(([key, prevProp]) => {
      if (!(key in newProps)) hostPatchProps(el, key, prevProp, null);
    });
  }

  function mountChildren(vnode, container, parentComponent) {
    for (const v of vnode.children) {
      patch(null, v, container, parentComponent);
    }
  }

  function processComponent(n1, n2, container, parentComponent) {
    /**
     * 主要逻辑有：挂载组件、更新组件
     */
    //初始化流程，目前只关注挂载组件过程
    mountComponent(n2, container, parentComponent);
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
    effect(() => {
      if (!instance.isMounted) {
        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy, h));
        patch(null, subTree, container, parentComponent);
        initialVnode.el = subTree.el;

        console.log("init", subTree);

        instance.isMounted = true;
      } else {
        const { proxy } = instance;
        const subTree = instance.render.call(proxy, h);
        const prevSubTree = instance.subTree;
        patch(prevSubTree, subTree, container, parentComponent);
        instance.subTree = subTree;
      }
    });
  }

  return {
    createApp: createAppAPI(render),
  };
}
