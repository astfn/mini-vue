## 前言

​	前面我们已经对双端对比算法的整体框架进行了思路梳理，现在让我们一起来用代码进行具体实现。

### 功能点

​	而实现的具体功能点，就是上篇文章中所拆分的各种特殊case，它们也是双端对比算法中比较基础的case。

1. 自左向右对比后，右侧部分正好是待处理区间，且只需要新增或删除节点
2. 自左向右对比后，右侧部分正好是待处理区间，且只需要新增或删除节点

这两种情况各自又可以再拆分，特殊化为：

* newChildren.length > oldChildren.length, 且只需要新增节点
* newChildren.length < oldChildren.length, 且只需要删除节点

### 设计指针

 	既然要进行双端对比，肯定要使用一些指针来进行索引，通过分析可知，双端对比算法只需要三个指针：

* 自左向右对比：只需一个指针 i
* 自右向左对比：需要定义 e1、e2 指针，分别指向新旧 children 的尾部

由于双端对比算法处理的是 ArrayToArray 的情景，而自左向右对比对于数组来说都是从 0 开始，因此只需要一个指针 i 即可；但自右向左对比就不同了，由于不能保证新旧 children 的长度一致，因此需要定义两个指针 e1、e2 来分别指向新旧 children 的尾部。

## 代码实现

### example code

```
import { useState } from "./hooks.js";

/**
 * 1.自左向右对比，找到不同处，指针停止移动。
 *   此时右半部分恰好就是要处理的区间
 *   并且只需新增或删除节点
 */
////1.1 new children 比 old children 长 (新增节点)
const oldArray = ["A", "B"];
const newArray = ["A", "B", "D", "E"];

//// 1.2 new children 比 old children 短 (删除节点)
// const oldArray = ["A", "B", "D", "E"];
// const newArray = ["A", "B"];

/**
 * 2.自右向左对比，找到不同处，指针停止移动。
 *   此时左半部分恰好就是要处理的区间
 *   并且只需新增或删除节点
 */
////2.1 new children 比 old children 长 (新增节点)
// const oldArray = ["B", "C"];
// const newArray = ["D", "E", "B", "C"];

//// 2.2 new children 比 old children 短 (删除节点)
// const oldArray = ["D", "E", "B", "C"];
// const newArray = ["B", "C"];

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
    const targetChildren = (this.convert ? newArray : oldArray).map((item) =>
      h("li", { key: item }, item)
    );
    return h("div", {}, [
      h("button", { onClick: () => this.setConvert(true) }, "ArrayToArray"),
      h("ul", {}, targetChildren),
    ]);
  },
};
```

#### 为 ArrayChildren 设置 key

​	在实际开发时，我们都会给列表中的每一个 item 绑定一个 key 属性，正如 [example code](##example code) 中所示代码一样。

​	因为在双端对比算法中，key 是判断新旧 vnode 是否完全改变的重要依据。

### patchKeyedChildren

​	在之前的 patchChildren 逻辑中，处理 ArrayToArray 只是无脑的卸载再重新挂载，现在我们要实现双端对比算法处理该情景。

​	具体的逻辑将被抽离到 patchKeyedChildren 方法中实现。

更新 <span id='patchKeyedChildren_patchChildren'>patchChildren</span> 代码：

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
         * unmountChildren(c1);
         * mountChildren(c2, n2.el, parentComponent);
         */
        patchKeyedChildren(c1, c2);
      }
    }
  }
```

<span id='patchKeyedChildren'>patchKeyedChildren</span> 方法打桩

```
  function patchKeyedChildren(c1, c2) {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
  }
```

### 自左向右对比

### 自右向左对比