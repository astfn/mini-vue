## who?

​	我们知道，日常的前端开发大部分都是基于浏览器的，因此我们在实现 runtime-core 时，处理 `Shapflags.ELEMENT` 类型的 vnode ，采用的是原生 js 提供的 dom 方法。但在实际开发场景中，开发者由于需求问题，可能不允许在普通 dom 的基础上去开发。

​	例如：基于 canvas 开发、基于其它终端开发……

​	由于这些开发平台不同，因此所暴露的操作节点的 api 也就不同，但大致的 api 功能可能是类似的，例如：创建节点、编辑节点属性、给节点添加子节点……等等。

​	因此，为了兼容其它平台的开发，我们就不能够在底层代码里将操作节点的 api 写死，而 createRenderer 就是为了实现这个功能的。

​	createRenderer 是 vue3 提供的一个新 api，它允许用户创建一个自定义渲染器。通过提供目标平台特定的操作节点的 API，你可以在非 DOM 环境中也享受到 Vue 核心运行时的特性。

## 实现思路

​	我们既然不能够在底层代码里将操作节点的 api 写死，那么就可以让用户来决定这些 api。当然了，日常的前端开发大部分都是基于浏览器的，因此我们可以将默认的 dom 处理逻辑保留下来。

在处理 `Shapflags.ELEMENT` 类型的 vnode 时，操作节点的相关功能都在 `mountElement` 方法中，主要涉及到三种节点操作：

1. 创建节点
2. 为节点设置 props
3. 将节点插入到父级容器中

因此，我们可以将这三种操作分别抽象为：createElement、patchProps、insert。而这三种 api 由外部传入，让用户来决定，从而实现其他平台的兼容开发。

​	核心思路很简单，但较难的是这些改动需要兼容现有的代码逻辑，如何更好的组织代码之间的关系也是非常重要的。

## 代码实现

### 替换 API

mountElement

​	把创建节点、为节点设置 props、将节点插入到父级容器中，这三种操作，替换成由外部（createRenderer）传入的稳定 api。

```
 function mountElement(vnode, container, parentComponent) {
    // const el = (vnode.el = document.createElement(vnode.type));
    const el = (vnode.el = createElement(vnode.type));
    const { children, props, shapFlag } = vnode;

    //props
    //const isOn = (key: string) => /^on[A-Z]/.test(key);
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
```

​	不再直接暴露 render，而是让 createRenderer 函数将原有的 render 等其它方法进行包裹（利用闭包接收外部传入的 options），并把 createRenderer 暴露出去

```
import { ShapFlags } from "../shared/ShapFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { h } from "./h";
import { Fragment, Text } from "./vnode";

export function createRenderer(options) {
  const { createElement, patchProps, insert } = options;

  function render(vnode, container, parentComponent) {……}

  function patch(vnode, container, parentComponent) {……}

  function procescsText(vnode, container) {……}

  function procescsFragment(vnode, container, parentComponent) {……}

  function procescsElement(vnode, container, parentComponent) {……}

  function mountElement(vnode, container, parentComponent) {……}

  function mountChildren(vnode, container, parentComponent) {……}
  ……
  ……
}
```

将默认支持的操作 dom 节点的逻辑抽离到 <span id='替换API_runtime-dom '>runtime-dom -> index.ts</span>

* 将原有的 dom 节点操作逻辑，按照约定的 options 进行抽离
* 再调用 createRenderer 并把这些封装好的方法作为 options 传递进去，创建出来一个操作 dom 节点的 renderer（也就是我们默认的 render 逻辑）

```
import { createRenderer } from "../runtime-core";

function createElement(type) {
  return document.createElement(type);
}

function patchProps(el, key, value) {
  const isOn = (key: string) => /^on[A-Z]/.test(key);
  if (isOn(key)) {
    const event = key.slice(2).toLocaleLowerCase();
    el.addEventListener(event, value);
  } else {
    el.setAttribute(key, value);
  }
}

function insert(el, container) {
  container.appendChild(el);
}

const renderer: any = createRenderer({
  createElement,
  patchProps,
  insert,
});
```

### 正确导出 createApp 方法

​	由于我们对原有的 render 方法进行了改造（不再暴露 render 方法，取而代之的是 createRenderer），而 createApp 中又引入了 render 方法，因此我们需要兼容一下 createApp 方法。

其实现在的需求可以拆分成两个：

1. createApp 需要拿到当前的 render 方法
2. 参考官网的 createRenderer api，需要在 createRenderer 调用后返回 createApp 方法。

由于 createRenderer 将整个 render 相关的逻辑进行了包裹，所以 createRenderer 能够很轻松的拿到 render 方法。

​	因此，我们可以把 createApp 包裹成 `createAppAPI(render)`，同样利用闭包将 render 方法传入

```
export function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      mount(rootContainer) {
        //1. 先将组件统一转化为 vnode，后续都会基于 vnode 进行各种操作
        //2. 创建组件实例，并 render
        const vnode = createVNode(rootComponent);
        const targetRootContainer = getRootContainer(rootContainer);
        render(vnode, targetRootContainer, null);
      },
    };
  };
}
```

​	然后 createRenderer 再返回 createAppAPI 的调用结果 (就是原来的createApp)，并把 render 方法传入即可。

```
import { ShapFlags } from "../shared/ShapFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { h } from "./h";
import { Fragment, Text } from "./vnode";

export function createRenderer(options) {
  ……
  return {
    createApp: createAppAPI(render),
  };
}
```

​	而在实现上述功能后，我们其实已经更改了 createApp 方法，因此需要兼容一下使用 createApp 的地方。

​	但是 createApp 是直接暴露给用户使用的，因此我们不能直接把当前的 createAppAPI 暴露给用户，应该暴露的是 createAppAPI 调用的结果。

而在上文中，我们主要实现了两个功能：

1. 抽离默认的 dom 节点操作逻辑，并利用 createRenderer 创建出来了默认的 renderer
2. createRenderer 支持返回 createApp 方法

因此，我们只需要在 <a href='#替换API_runtime-dom'>runtime-dom -> index.ts</a> 中，返回 renderer.createApp 即可。

更新 <span id='正确导出createApp方法_runtime-dom'>runtime-dom -> index.ts</span> 代码如下

```
……

export function createApp(...args) {
  return renderer.createApp(...args);
}
```

### 导出 runtime-dom API

​	新的 createApp 是在 runtime-dom -> index.ts 中导出的，因此我们需要在 mini-vue 的入口文件 (src/index.ts) 中暴露 runtime-dom 所提供的 api

​	而现在的包入口文件导出的是 `runtime-core`，我们只需要再导出一下 `runtime-dom`，即可。

```
export * from "./runtime-core";
export * from "./runtime-dom";
```

​	虽然这样做可以，但是从设计的角度出发: runtime-core 是一些非常基础的内部核心代码，而 runtime-dom 实际上是对 runtime-core 的上层抽象，把默认的 render 逻辑 (操作dom节点) 抽离了出来。

​	其实我们可以只暴露 runtime-dom 给用户，如果用户想要自定义 renderer，可以再引入 createRenderer。

​	而 createRenderer 又属于 runtime-core 的基础 api，而我们又只想暴露出去 runtime-dom。实际上我们只需要在 runtime-dom 中把 runtime-core 中的 api 统一暴露出去，再在包入口文件中只导出 runtime-dom 即可。

更新 <a href='#正确导出createApp方法_runtime-dom'>runtime-dom -> index.ts</a> 代码如下

```
……
……
export * from "../runtime-core";
```

包入口文件只需导出 runtime-dom 模块即可

```
export * from "./runtime-dom";
```

