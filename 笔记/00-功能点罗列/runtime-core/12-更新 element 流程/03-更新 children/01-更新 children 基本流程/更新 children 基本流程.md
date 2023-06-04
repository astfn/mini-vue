## 前言 & 逻辑梳理

​	上一篇文章中，我们已经实现了更新 element vnode 的 props 逻辑。现在，我们将实现 patchChildren 功能。

​	而更新 element vnode 的 children，首先要知道目前 element vnode 的 children 有哪些类型，我们要处理不同类型 children vnode 的更新逻辑。

目前，element vnode 的 children 只有两种类型：

1. 纯文本类型 (`ShapFlags.TEXT_CHILDREN` )
2. 数组类型 (`ShapFlags.ARRAY_CHILDREN`)

旧的 children 可以是任一类型，新的 children 也可以是任一类型。因此，patchChildren 总共有四种 case:

1. ArrayToText
2. TextToText
3. TextToArray
4. ArrayToArray

所以在进行代码实现时，我们会判断新旧 vnode 的类型，来对这几种 case 的 children 进行 patch 操作。

## 代码实现

### example code

App.js

```
// import TextToArray from "./TextToArray.js";
// import TextToText from "./TextToText.js";
import ArrayToText from "./ArrayToText.js";
// import ArrayToArray from "./ArrayToArray.js";

export const App = {
  render(h) {
    return h("div", {}, [h("h2", {}, `updateElementChildren`), h(ArrayToText)]);
  },
};
```

#### ArrayToText

```
import { useState } from "./hooks.js";

export default {
  setup() {
    const [convert, setConvert] = useState(false);
    window.setConvert = setConvert;
    return {
      convert,
      setConvert,
    };
  },
  render(h) {
    const targetChildren = this.convert
      ? "Ashuntefannao"
      : [1, 2, 3].map((item) => h("li", {}, item));

    return h("div", {}, targetChildren);
  },
};
```

#### TextToText

```
import { useState } from "./hooks.js";

export default {
  setup() {
    const [convert, setConvert] = useState(false);
    window.setConvert = setConvert;
    return {
      convert,
      setConvert,
    };
  },
  render(h) {
    const targetChildren = this.convert ? "new-Ashuntefannao" : "Ashuntefannao";

    return h("div", {}, targetChildren);
  },
};
```

#### TextToArray

```
import { useState } from "./hooks.js";

export default {
  setup() {
    const [convert, setConvert] = useState(false);
    window.setConvert = setConvert;
    return {
      convert,
      setConvert,
    };
  },
  render(h) {
    const newArrayVNodes = [1, 2, 3].map((item) => h("li", {}, item));
    const targetChildren = this.convert ? newArrayVNodes : "Ashuntefannao";

    return h("div", {}, targetChildren);
  },
};
```

#### ArrayToArray

```
import { useState } from "./hooks.js";

export default {
  setup() {
    const [convert, setConvert] = useState(false);
    return {
      convert,
      setConvert,
    };
  },
  render(h) {
    const oldArray = [1, 2, 3];
    const newArray = [2, 3, 4];
    const targetChildren = (this.convert ? newArray : oldArray).map((item) =>
      h("li", {}, item)
    );
    return h("div", {}, [
      h("button", { onClick: () => this.setConvert(true) }, "ArrayToArray"),
      h("ul", {}, targetChildren),
    ]);
  },
};

```

### patchChildren 方法打桩

*patchChildren*

```
function patchChildren(n1, n2, container, parentComponent) {}
```

在父流程方法 patchElement 中调用 patchChildren，处理更新 children 的逻辑

```
  function patchElement(n1, n2, container, parentComponent) {
    console.log("patchElement");
    console.log("current tree", n2);
    console.log("prev tree", n1);

    const el = (n2.el = n1.el);
	
	//更新 children
    patchChildren(n1, n2, container, parentComponent);

    const oldProps = n1.props;
    const newProps = n2.props;
    patchProps(el, oldProps, newProps);
  }
```

### ArrayToText

1. 判断 new vnode 类型是否为 `ShapFlags.TEXT_CHILDREN` ，并且 old vnode 的类型为 `ShapFlags.ARRAY_CHILDREN`
2. 将老的 array children 卸载掉
3. 挂载新的纯文本节点

更新 <span id='ArrayToText_patchChildren'>patchChildren</span> 代码

```
function patchChildren(n1, n2, container, parentComponent) {
	//old vnode info
	const { shapFlag: prevShapFlag, children: c1 } = n1;
	//new vnode info
    const { shapFlag, children: c2 } = n2;
    if (shapFlag & ShapFlags.TEXT_CHILDREN) {
      if (prevShapFlag & ShapFlags.ARRAY_CHILDREN) {
        /**
        * todo: 
        * 1. unmountChildren(c1)
        * 2. hostSetElementText(n2.el, c2)
        */ 
      }
    }
}

```

#### unmountChildren

* 遍历老的 array children ，并将它们从自身的父节点上移除
* 移除的逻辑涉及到操作 dom，因此也应该像 `createRenderer` 的部分 option 一样抽离成 hostRemove 方法，支持使用者个性化配置，从而兼容其他开发平台。
* 在 runtime-dom 中实现 remove 方法，默认处理浏览器平台的开发场景

*unmountChildren*

```
function unmountChildren(children) {
  for (let i = 0; i < children.length; i++) {
    const el = children[i].el;
    hostRemove(el);
  }
}
```

*<span id='unmountChildren_createRenderer'>createRenderer</span>*

​	在所接受的 option 参数中预留 remove 方法，并在接收时重命名为 hostRemove 以方便后续调试进行区分。

```
export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProps: hostPatchProps,
    insert: hostInsert,
    remove: hostRemove
  } = options;
  ……
}
```

*remove* 

在 runtime-dom 中实现 remove 方法，默认处理浏览器平台的开发场景

* 只需接收需要移除的子节点本身
* 通过原生 dom api，找到该节点的父节点，再把自身从父节点上移除掉

```
function remove(child) {
  const parent = child.parentNode;
  if (parent) {
    parent.removeChild(child);
  }
}
```

再将其传入到默认创建的 renderer 中

```
const renderer: any = createRenderer({
  createElement,
  patchProps,
  insert,
  remove
});
```

#### hostSetElementText

​	将旧的 array children 卸载掉以后，要把最新的纯文本节点挂载上去，也就是接下来要实现的 hostSetElementText 方法：

​	由于设置纯文本节点的操作也涉及到 dom 操作，因此也要将其抽离到 createRenderer 的参数 options 中。

更新 <a href="#unmountChildren_createRenderer">createRenderer</a> 代码

```
export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProps: hostPatchProps,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;
  ……
}
```

到 runtime-core 中实现 setElementText 方法，处理默认的浏览器开发平台逻辑：

```
function setElementText(el, text) {
  el.textContent = text;
}
```

再将其传入到默认创建的 renderer 中

```
const renderer: any = createRenderer({
  createElement,
  patchProps,
  insert,
  remove,
  setElementText,
});
```

### TextToText

1. 判断新旧 vnode 的类型是否都为 `ShapFlags.TEXT_CHILDREN`
2. 如果新旧纯文本值不一样，则复用 hostSetElementText 方法，挂载新的纯文本节点

更新 <a href="#ArrayToText_patchChildren">patchChildren</a> 方法代码

```
  function patchChildren(n1, n2, container, parentComponent) {
    const { shapFlag: prevShapFlag, children: c1 } = n1;
    const { shapFlag, children: c2 } = n2;
    if (shapFlag & ShapFlags.TEXT_CHILDREN) {
      if (prevShapFlag & ShapFlags.ARRAY_CHILDREN) {
        unmountChildren(c1);
        hostSetElementText(n2.el, c2);
      } else {
        c1 !== c2 && hostSetElementText(n2.el, c2);
      }
    }
```

#### 代码优化

​	实现功能后，可以发现第二层的 `if/else` 中都会调用 hostSetElementText 方法，因此可以把 hostSetElementText 的调用逻辑放到外部：

更新 <span id='TextToText_patchChildren'>patchChildren</span> 方法代码

```
  function patchChildren(n1, n2, container, parentComponent) {
    const { shapFlag: prevShapFlag, children: c1 } = n1;
    const { shapFlag, children: c2 } = n2;
    if (shapFlag & ShapFlags.TEXT_CHILDREN) {
      if (prevShapFlag & ShapFlags.ARRAY_CHILDREN) {
        unmountChildren(c1);
        hostSetElementText(n2.el, c2);
      }
       c1 !== c2 && hostSetElementText(n2.el, c2);
    }
  }
```

### TextToArray

1. 将旧的纯文本节点内容清空
2. 将最新的 array children 挂载到节点上（复用 mountChildren 方法）

更新 <a href="#TextToText_patchChildren">patchChildren</a> 方法代码

```
  function patchChildren(n1, n2, container, parentComponent) {
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
        mountChildren(n2, n2.el, parentComponent);
      }
    }
  }
```

#### 代码优化

这里我们可以再小优化一下：

* unmountChildren 方法接收的第一个参数含义是 vnode.children ,而 mountChildren 接收的第一个参数是 vnode，mountChildren 具体代码逻辑也是遍历 vnode.children
* 所以为了代码风格更加统一，mountChildren 的第一个参数也可以改造成直接传入 vnode.children 的形式

更新 mountChildren 代码

* 参数 vnode -> children

```
  function mountChildren(children, container, parentComponent) {
    for (const v of children) {
      patch(null, v, container, parentComponent);
    }
  }
```

>调用 mountChildren 的地方，都要改一下，保证传入正确的参数。

在 <span id="TextToArray_patchChildren ">patchChildren</span> 方法中调用 mountChildren 时，直接传入 new vnode children 即可。

```
  function patchChildren(n1, n2, container, parentComponent) {
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
        // 第一个参数直接传入 new vnode children 即可
        mountChildren(c2, n2.el, parentComponent);
      }
    }
  }
```

### ArrayToArray

无脑实现版本逻辑：

1. 卸载掉旧的 array children
2. 再把新的 array children 挂载上去即可

更新 <a href="#TextToArray_patchChildren ">patchChildren</a> 代码

```
  function patchChildren(n1, n2, container, parentComponent) {
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
        mountChildren(c2, n2.el, parentComponent);
      } else {
        /**
         * 无脑实现版本，后续需要经典的双端对比算法来打补丁
         */
        unmountChildren(c1);
        mountChildren(c2, n2.el, parentComponent);
      }
    }
  }
```

## 关于双端对比 vnode 算法

​	vue 里有个很出名的双端对比算法，就是用于处理 ArrayToArray 的这种 case。为啥就 ArrayToArray 这种 case 比较特殊呢？

​	原因很简单，因为 ArrayToArray 的 case，可以进行性能优化。

​	你可能会有疑问，其它的 case 不能进行性能优化吗？

答案是：没错！不能！

1. ArrayToText
   * 新旧 children 的 shapFlag type 完全不一样，只能卸载再重新挂载
2. TextToText
   * 虽然新旧 children 的 shapFlag type 是一样的，但没什么性能优化点，因为它只是个最最基本的文本更新，重新塞一遍值就好
3. TextToArray
   * 与 ArrayToText 同理
4. ArrayToArray
   * 新旧 children 都是数组，而在实际开发中这个 children 长度可能非常大
   * 无脑卸载再挂载，存在着很大的浪费性能隐患（除非新旧 children 中的每一个元素都完全不一样）
   * 因此，我们要在两个 children 中找不同，尽力复用老 children 中的节点，从而省掉那些不必要的卸载再挂载的流程，节省性能

关于 vue 中双端对比算法的实现，将在后续文章中讲解。