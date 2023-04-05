## Fragment

### who？	

早期在使用 vue2.x 时，如果想正确编写一个组件，开发人员必须让组件有且仅有一个根节点。在很多情况下这个根节点是没有实际意义的，只会徒增元素的嵌套层级。

​	所以在后期， vue 推出了 Fragment 类型的节点。可以将其视为 vue 的虚拟根节点，Fragment 只起到将组件包裹的作用，并不会以真实 dom 的形式渲染到页面上。

### 实现思路

​	根据 Fragment 的功能描述，我们不难发现：要实现 Fragment  实际上就是直接把 Fragment 的 children 挂载到 Fragment 的父级节点上，我们不用关注 Fragment 节点本身。

​	其实将 children 挂载到目标节点的功能我们已经在 mountElement 中的 mountChildren 中实现过了。只不过此时调用 mountChildren 时，是把 children 挂载到当前的 el 上。

​	我们可以在调用 createVNode 时，传入一个特定的 type，用于标识 Fragment 类型的虚拟节点，然后在 path 方法中判断如果当前 vnode.type 是 Fragment，则直接调用 mountChildren 方法，把 Fragment 的 children 直接挂载到父级 container 上即可。

### 代码实现

​	首先，我们可以把 Fragment 定义成一个全局常量，为了保证唯一性，可以使用 Symbol 构建。

vnode.ts

```
export const Fragment = Symbol("Fragment");
```

然后在 path 方法中判断 vnode.type 进行个性化处理

```
function patch(vnode, container) {
  const { type, shapFlag } = vnode;
  switch (type) {
    case Fragment: {
      procescsFragment(vnode, container);
      break;
    }
    default: {
      ……
    }
  }
}
```

procescsFragment

​	直接调用 mountChildren 方法，把 Fragment 的 children 直接挂载到父级 container 上即可。

```
function procescsFragment(vnode, container) {
  mountChildren(vnode, container);
}
```

### 使用 Fragment 优化 slots

​	之前在实现组件的 slots 功能时，相信不少小伙伴都发现了一个比较难受的点，就是在渲染 slot 时，我们总是会使用 createVnode 创建一个 div 把 slot 的内容包裹起来。虽然 createVnode 能够实现降维操作 (支持处理 `Array<VNnode>` 类型的 children)，但每次都会凭空创建出来一个 div，增加 dom 的嵌套层级。

​	在实现了 Fragment 后，我们就能够快速解决这个问题，只需要在 renderSlots 方法中使用 createVnode 的地方传入 Fragment type 即可。

runtime-core -> helpers -> renderSlots.ts

```
import { createVNode, Fragment } from "../vnode";

export function renderSlots(slots, name, props) {
  const slot = slots[name];
  if (slot) {
    if (typeof slot === "function")
      return createVNode(Fragment, {}, slot(props));
  }
}
```

## Text node

### who？	

​	Text node 就是纯文本节点，实际上我们现有的逻辑是不支持在类型为 array 的 children 中直接传入一个字符串的，因为在处理 shapFlag 为 ShapFlags.ELEMENT 的 vnode 时，所支持处理的 children 类型有三种：

```
export enum ShapFlags {
  ELEMENT = 1,
  STATEFUL_COMPONENT = 1 << 1,
  //1. children 为 string
  TEXT_CHILDREN = 1 << 2,
  //2. children 为 Array<VNode>
  ARRAY_CHILDREN = 1 << 3,
  //3. children 为 { [key:string]: (props)=> VNode|Array<VNode>}
  SLOTS_CHILDREN = 1 << 4,
}
```

​	在处理 `ShapFlags.ARRAY_CHILDREN` 时，要求里面的每一个元素为 VNode，不支持传入纯文本。因为在 mountChildren 时，会遍历 children 并执行 patch 方法，而 patch 方法只支持处理 vnode。

### 实现思路

​	我们可以像实现 Fragment 一样，在 createVNode 时，传入一个 Text type，之后在 patch 时，个性化处理，直接把文字挂载到父级容器上。

### 代码实现

vnode.ts

```
export const Text = Symbol("Text");
```

然后在 path 方法中判断 vnode.type 进行个性化处理

```
function patch(vnode, container) {
  const { type, shapFlag } = vnode;
  switch (type) {
    case Fragment: {
      procescsFragment(vnode, container);
      break;
    }
    case Text: {
      procescsText(vnode, container);
      break;
    }
    default: {
     	……
      }
    }
  }
}
```

procescsText

```
function procescsText(vnode, container) {
  const el = (vnode.el = document.createTextNode(vnode.children));
  container.appendChild(el);
}
```

在 vnode.ts 中新增一个 api (createTextVNode) 暴露给用户使用

```
export function createTextVNode(text: string) {
  return createVNode(Text, {}, text);
}
```

#### 注意点：

​	在实现 procescsText 时，创建 el 的同时并把 el 保存到了 vnode 上。这一步操作和 procescsElement 中 mountElement 中的操作一样。都是为了后续用户能够通过 $el 访问当前组件的根节点。因为我们不排除用户在编写一个组件时，根节点就是一个 Text node。

>流程回顾：
>
>​	在创建 el 的同时并把 el 保存到了 vnode 上。这样当组件的 setupComponent 完成之后，在执行 setupRenderEffect 时，会把组件的 render option 执行，并把返回的 subTree (vnode) 进行 patch，如果 subTree 是一个 ShapFlags.ELEMENT 类型的节点，就会走 mountElement ，然后这时候将 el 保存在 vode 上。当 patch subTree 的流程走完后，就能够访问到 subTree.el 此时我们就可以再把 subTree.el 挂载到组件的 instance 上，用户就可以通过 this 间接访问 instance.proxy 所暴露的 $el 属性。