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
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;

  function render(vnode, container, parentComponent) {
    //调用 patch 对虚拟节点进行具体处理
    console.log("render", vnode, container, parentComponent);
    patch(null, vnode, container, parentComponent, null);
  }

  /**
   * n1: old vnode tree
   * n2: new vnode tree
   */
  function patch(n1, n2, container, parentComponent, anchor) {
    const { type, shapFlag } = n2;
    switch (type) {
      case Fragment: {
        procescsFragment(n1, n2, container, parentComponent, anchor);
        break;
      }
      case Text: {
        procescsText(n1, n2, container);
        break;
      }
      default: {
        // 根据 vnode 的类型，来决定是处理 component 还是 element
        if (shapFlag & ShapFlags.ELEMENT) {
          procescsElement(n1, n2, container, parentComponent, anchor);
        } else if (shapFlag & ShapFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent, anchor);
        }
      }
    }
  }

  function procescsText(n1, n2, container) {
    const el = (n2.el = document.createTextNode(n2.children));
    container.appendChild(el);
  }

  function procescsFragment(n1, n2, container, parentComponent, anchor) {
    mountChildren(n2.children, container, parentComponent, anchor);
  }

  function procescsElement(n1, n2, container, parentComponent, anchor) {
    /**
     * 主要逻辑有：挂载、更新
     */
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  function mountElement(vnode, container, parentComponent, anchor) {
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
      mountChildren(vnode.children, el, parentComponent, anchor);
    }

    hostInsert(el, container, anchor);
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    console.log("patchElement");
    console.log("current tree", n2);
    console.log("prev tree", n1);

    const el = (n2.el = n1.el);

    patchChildren(n1, n2, container, parentComponent, anchor);

    const oldProps = n1.props;
    const newProps = n2.props;
    patchProps(el, oldProps, newProps);
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el;
      hostRemove(el);
    }
  }

  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const { shapFlag: prevShapFlag, children: c1 } = n1;
    const { shapFlag, children: c2 } = n2;
    if (shapFlag & ShapFlags.TEXT_CHILDREN) {
      if (prevShapFlag & ShapFlags.ARRAY_CHILDREN) {
        unmountChildren(c1);
        hostSetElementText(n2.el, c2);
      }
      c1 !== c2 && hostSetElementText(n2.el, c2);
    } else {
      if (prevShapFlag & ShapFlags.TEXT_CHILDREN) {
        hostSetElementText(n2.el, "");
        mountChildren(c2, n2.el, parentComponent, anchor);
      } else {
        /**
         * 无脑实现版本，后续需要经典的双端对比算法来打补丁
         */
        // unmountChildren(c1);
        // mountChildren(c2, n2.el, parentComponent);
        patchKeyedChildren(c1, c2, n2.el, parentComponent, anchor);
      }
    }
  }

  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;

    function isSomeVNodeType(n1, n2) {
      return n1.type == n2.type && n1.key == n2.key;
    }

    //自左向右对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
        i++;
      } else {
        break;
      }
    }
    //自右向左对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
        e1--;
        e2--;
      } else {
        break;
      }
    }

    //恰好左/右半部分是处理区间--只需新增节点
    if (i > e1) {
      while (e2 >= i) {
        const n2 = c2[e2];
        const anchor = e2 + 1 >= c2.length ? null : c2[e2 + 1].el;
        patch(null, n2, container, parentComponent, anchor);
        e2--;
      }
    }
    //恰好左/右半部分是处理区间--只需删除节点
    else if (i > e2) {
      while (e1 >= i) {
        const n1 = c1[e1];
        hostRemove(n1.el);
        e1--;
      }
    } else {
      /**
       * 删除节点
       */
      const s1 = i;
      const s2 = i;

      const toBePatchChild = e2 - s2 + 1;
      let patched = 0;
      // Map<newVNode.key, newVNodeIndex>
      const keyToNewIndexMap = new Map();
      for (let i = s2; i <= e2; i++) {
        const nextNode = c2[i];
        keyToNewIndexMap.set(nextNode.key, i);
      }

      // 记录在 newChildren 中匹配到的节点 index
      let newIndex;
      // 遍历 oldChildren
      for (let i = s1; i <= e1; i++) {
        const prevNode = c1[i];
        if (patched >= toBePatchChild) {
          hostRemove(prevNode.el);
          continue;
        }

        newIndex = undefined;
        // 从 newChildren 中匹配 oldChildNode
        if (prevNode.key != null) {
          newIndex = keyToNewIndexMap.get(prevNode.key);
        } else {
          for (let j = s2; j <= e2; j++) {
            if (isSomeVNodeType(prevNode, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }

        //匹配到，则 patch；反之 remove
        if (newIndex === undefined) {
          hostRemove(prevNode.el);
        } else {
          patch(
            prevNode,
            c2[newIndex],
            container,
            parentComponent,
            parentAnchor
          );
          patched++;
        }
      }
    }
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

  function mountChildren(children, container, parentComponent, anchor) {
    for (const v of children) {
      patch(null, v, container, parentComponent, anchor);
    }
  }

  function processComponent(n1, n2, container, parentComponent, anchor) {
    /**
     * 主要逻辑有：挂载组件、更新组件
     */
    //初始化流程，目前只关注挂载组件过程
    mountComponent(n2, container, parentComponent, anchor);
  }

  function mountComponent(initialVnode, container, parentComponent, anchor) {
    /**
     * 创建组件实例
     * 对组件实例进行初始化设置
     */
    const instance = createComponentInstance(initialVnode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container, instance, anchor);
  }

  function setupRenderEffect(
    instance,
    initialVnode,
    container,
    parentComponent,
    anchor
  ) {
    effect(() => {
      if (!instance.isMounted) {
        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy, h));
        patch(null, subTree, container, parentComponent, anchor);
        initialVnode.el = subTree.el;

        console.log("init", subTree);

        instance.isMounted = true;
      } else {
        const { proxy } = instance;
        const subTree = instance.render.call(proxy, h);
        const prevSubTree = instance.subTree;
        patch(prevSubTree, subTree, container, parentComponent, anchor);
        instance.subTree = subTree;
      }
    });
  }

  return {
    createApp: createAppAPI(render),
  };
}
