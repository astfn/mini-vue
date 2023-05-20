## 前言 & 逻辑梳理

​	上一篇文章中，我们已经实现了更新 element vnode 基本流程的搭建。之后，我们将专注于具体细节的实现，本篇文章将讲解 element vnode 对 props 的更新流程。

​	在具体代码实现之前，我们先简单梳理一下更新 props 的流程，以及有哪些 case 需要考虑：👇

​	更新 props，无非就是拿到新旧 props 进行比较的过程，根据比较结果进行不同操作，实现 props 的更新。

<span id='新旧 props 的对比过程所涉及到的 case'>而新旧 props 的对比过程，主要涉及到以下情况</span>：

1. oldProps 中的 `key` 在 newProps 中不存在（delete）
2. oldProps 中的 `key` 也存在于 newProps 中，而这个 `key` 在 newProps 中对应的值可能发生了改变
   * 发生改变（patch）
   * 没有改变（无需操作）
3. newProps 中出现了新的 `key` （add）

<img src="更新 props.assets/001.png" alt="001" style="zoom:80%;" />

## 代码实现

​	了解完更新 props 的流程，以及有哪些 case 需要考虑，现在我们可以关注于代码实现了。

<span id='example_code'>***example code***</span>

​	该示例代码将覆盖更新 props 流程的各种 case，用于 props 更新流程功能实现后的测试。

```
import { ref } from "../../lib/mini-vue.esm.js";

export const App = {
  setup() {
    const rootNodeProps = ref({
      class: "green",
    });

    const changeClassProps = () => {
      rootNodeProps.value.class = "red";
    };
    const deleteClassProps = () => {
      rootNodeProps.value.class = undefined;
    };
    const addFooProps = () => {
      rootNodeProps.value = {
        class: rootNodeProps.value.class,
        foo: "foo",
      };
    };

    return { rootNodeProps, changeClassProps, deleteClassProps, addFooProps };
  },
  render(h) {
    const changeClassPropsBtn = h(
      "button",
      {
        onClick: this.changeClassProps,
      },
      `changeClassProps`
    );

    const deleteClassPropsBtn = h(
      "button",
      {
        onClick: this.deleteClassProps,
      },
      `deleteClassProps`
    );

    const addFooPropsBtn = h(
      "button",
      {
        onClick: this.addFooProps,
      },
      `addFooProps`
    );

    return h("div", { ...this.rootNodeProps }, [
      h("p", {}, `Ashuntefannao`),
      changeClassPropsBtn,
      deleteClassPropsBtn,
      addFooPropsBtn,
    ]);
  },
};
```

### 设计 patchProps 函数

​	当使用 ref 定义的响应式变量 rootNodeProps 发生改变时，setupRenderEffect 中的 effect 副作用函数会重新执行，从而再次执行 patch 方法，只不过这次能够同时拿到新旧 vnode tree，从而走向 element 的更新逻辑 --patchElement 方法。

​	我们将设计一个 patchProps 函数，把更新 props 的逻辑放置其中，我们先来思考一下 patchProps 需要哪些形参。

* `oldProps`、`newProps`：将新旧 props 进行对比，得到最终的 props。
* `el`：将新旧 props 对比后，得到最新的 props，最终还要把最新的 props 更新到 el 上面。

### 获取 el 与新旧 props

#### 获取 el

​	在 patchElement 函数中，我们能够拿到 oldVNodeTree 与 newVNodeTree，但值得注意的是，**我们只能在 oldVNodeTree 上拿到 el**。

​	因为之前我们只是在 mountElement 中，把 el 挂载到了 vnode 上，而这个具有 el 的 vnode，会在更新逻辑中，以 oldVNodeTree 的参数形式传入到更新逻辑的相关函数中。

​	因此在 patchElement 函数中，我们只能通过 oldVNodeTree 拿到 el，并且，我们应该把这个 el 继续挂载到新的虚拟节点 newVNodeTree 上，方便后续获取。

#### 获取新旧 props

​	获取新旧 props 就非常简单了，直接分别从新旧虚拟节点中取出即可。现在，patchProps 函数所需要的参数我们都能够拿到了。

更新 patchElement 函数代码

```
  function patchElement(n1, n2, container, parentComponent) {
    console.log("patchElement");
    console.log("current tree", n2);
    console.log("prev tree", n1);

    const el = (n2.el = n1.el);

    const oldProps = n1.props;
    const newProps = n2.props;
    patchProps(el, oldProps, newProps);
  }
```

### 实现 patchProps 

​	回顾 <a href='#新旧 props 的对比过程所涉及到的 case'>新旧 props 的对比过程所涉及到的 case</a>，我们需要分别以 `newProps`、`oldProps` 为基础检索对方，才能够覆盖这些 case。

####  以 newProps 为基础, 检索 oldProps

 处理以下 case：

1. newProps 与 oldProps 都存在某个 key, 且值不一样 (进行 patch)
2. newProps 中存在某个 key, 但 oldProps 中不存在 (进行 add)

<span id='以 newProps 为基础, 检索 oldProps'>编写 patchProps 代码</span>

```
  function patchProps(el, oldProps, newProps) {
    Object.entries(newProps).forEach(([key, nextProp]) => {
      const prevProp = oldProps[key];
      if (prevProp !== nextProp) {
      	//TODO: 对 props 进行补丁
      }
    });
  }
```

​	而对 props 进行补丁的逻辑，我们已经在 mountElement 逻辑中封装过了，并且为了让 vue 支持不同平台的开发，实现了 createRenderer ，对 props 的补丁逻辑支持用户定义，在 runtime-core 中，以 hostPatchProps 的参数名称进行接收。（默认的 createRenderer option 已经被我们抽离为了 runtime-dom）

​	因此我们直接复用 hostPatchProps ，并对其进行改造。

#### 改造 hostPatchProps 方法

​	**拓展 hostPatchProps 方法的参数，让其接收旧的 prop 值**。

​	**其实 hostPatchProps 在默认的运行时逻辑 runtime-dom 中，目前并不需要 prop 的旧值**(`prevProp`)，因为基于现有的功能点，hostPatchProps 完全可以只关注 prop 的新值(`nextProp`)：

*  对于 mount 逻辑来说：`prevProp` 为空，无脑将 `nextProp` setAttribute 到 el 上即可
* 对于 update 逻辑来说：总共有三种情况，分别是 delete、add、patch，而我们只需要判断 `nextProp` 是否为空，就能够在 hostPatchProps 方法中覆盖这三种情况
  * 如果为空：直接 removeAttribute（覆盖 delete case）
  * 不为空，直接把 `nextProp`  setAttribute 到 el 上即可，因为无论是 add 还是 patch，都要把新值挂载到 el 上（覆盖 add/patch case）

---

​	但这就代表 hostPatchProps 没必要接收旧的 prop 值了吗？当然不是，因为上文说的很清楚，只是在**默认的运行时逻辑 runtime-dom 中**，**目前并不需要** prop 的旧值。

1. 我们不能保证其它平台在 patchProps 时，不需要 prevProp
2. 后续在拓展其它功能时，可能 runtime-dom 的 patchProps 逻辑也需要用到 prevProp

因此，让 hostPatchProps 接收 prevProp 非常有必要。

依据上文阐述，改造后的 hostPatchProps 代码如下：

```
function hostPatchProps(el, key, prevProp, nextProp) 
```

但由于我们默认使用的是 runtime-dom ，所以要改造 runtime-dom 中的 patchProps 逻辑，兼容 update 流程。

```
function patchProps(el, key, prevProp, nextProp) {
  const isOn = (key: string) => /^on[A-Z]/.test(key);

  if (isOn(key)) {
    const event = key.slice(2).toLocaleLowerCase();
    el.addEventListener(event, nextProp);
  } else {
    if (nextProp === undefined || nextProp === null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextProp);
    }
  }
}
```

由于 hostPatchProps 所接收的参数发生改变，所以不要忘了兼容老代码逻辑里调用它的地方，传入正确的参数。

**mountElement**

```
  function mountElement(vnode, container, parentComponent) {
    ……
    //处理 props
    Object.entries(props).forEach(([key, value]) => {
      hostPatchProps(el, key, null, value);
    });
	……
  }
```

改造完 hostPatchProps 方法，我们继续回到 [以 newProps 为基础, 检索 oldProps](####以 newProps 为基础, 检索 oldProps)，<span id='改造 hostPatchProps 方法_patchProps'>更新 <a href='#以 newProps 为基础, 检索 oldProps'>patchProps</a></span> 代码如下：

```
  function patchProps(el, oldProps, newProps) {
    Object.entries(newProps).forEach(([key, nextProp]) => {
      const prevProp = oldProps[key];
      if (prevProp !== nextProp) hostPatchProps(el, key, prevProp, nextProp);
    });
  }
```

####  以 oldProps 为基础, 检索 newProps

 处理以下 case：

* oldProps 中的某个 key, 在 newProps 中不存在了 (delete)

更新 <a href="#改造 hostPatchProps 方法_patchProps">patchProps</a> 代码如下：

```
  function patchProps(el, oldProps, newProps) {
    Object.entries(newProps).forEach(([key, nextProp]) => {
      const prevProp = oldProps[key];
      if (prevProp !== nextProp) hostPatchProps(el, key, prevProp, nextProp);
    });

    Object.entries(oldProps).forEach(([key, prevProp]) => {
      if (!(key in newProps)) hostPatchProps(el, key, prevProp, null);
    });
  }
```

## 功能测试

实现 props 的更新逻辑后，我们结合 <a href='#example_code'>example code</a> , run 一下代码，结果符合预期，如下图：

<img src="更新 props.assets/002.gif" alt="002" style="zoom:80%;" />

