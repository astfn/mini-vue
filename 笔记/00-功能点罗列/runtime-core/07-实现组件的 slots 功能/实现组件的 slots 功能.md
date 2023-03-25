## 需求探讨

​	其实探讨需求的过程，就是探讨用户期望如何使用该功能的过程。因此，我们只需要过一遍 slot 的基本使用过程即可。

*App.js*

```
<template>
	<Foo>
		<p> foo </p>
		……
	</Foo>
</template>
```

*Foo.js*

```
<template>
	<div> 
		<span> foo title </span>
		<slot> </slot>
	</div>
</template>
```

可以发现，最核心的功能点就是：将 Foo 组件被初始化时候的 children 扩充到自身根节点的 children 上，并渲染到指定位置即可。

我们可以把需求先拆分成小需求，然后逐一实现：

1. 默认插槽
   * 插入单个节点
   * 插入多个节点
2. 具名插槽
   * 根据名称插入到指定位置

## 代码实现

### 插入单个节点

*场景示例:*

<span id='插入单个节点_AppCpn'>App.js</span>

```
import Foo from "./Foo.js";

export const App = {
  render(h) {
    const FooCpn = h(Foo, {}, h("p", {}, "foo"));
    return h("div", { id: "root" }, [FooCpn]);
  },
};
```

<span id='插入单个节点_FooCpn'>Foo.js</span>

```
const FooCpn = {
  render(h) {
    const fooTitle = h("p", {}, `FooCpn title`);
    // this.$slots 目前相当于 instance.vnode.children
    return h("div", { class: "foo-cpn" }, [fooTitle, this.$slots]);
  },
};

export default FooCpn;
```

#### 实现访问 $slots

​	很简单，只需要在 PublicInstanceProxyHandlers 中拦截 $slots 即可。

```
const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
  $slots: (i) => i.slots,
};
```

​	为了后续在 runtime-core 中访问 slots 的方便性，选择将 slots 属性追加到组件实例 instance 上。

​	而实现把 slots 属性追加到 instance 上，并初始化的过程，就是  setupComponent 逻辑中预留的 initSlots 逻辑。

#### initSlots

```
export function setupComponent(instance) {
  initProps(instance, instance.vnode.props);
  initSlots(instance, instance.vnode.children);
  setupStatefulComponent(instance);
}
```

将 initSlots 逻辑独立抽离到 componentSlots.ts 文件中

```
export function initSlots(instance, children) {
  instance.slots = children;
}
```

此时 <a href='#插入单个节点_FooCpn'>Foo.js</a> 就能以我们预期的效果进行渲染

<img src="实现组件的 slots 功能.assets/001.png" alt="001" style="zoom:80%;" />

### 插入多个节点

#### 功能实现

​	在实现插入单个节点的功能后，我们继续实现插入多个节点的功能。首先，我们将 <a href='#插入单个节点_AppCpn'>App.js</a> 的内容更新：

<span id='插入多个节点_AppCpn'>App.js</span>

* 让 Foo 组件被初始化时，拥有多个 children

```
export const App = {
  render(h) {
    const FooCpn = h(Foo, {}, [
      h("p", {}, "foo"),
      h("p", { class: "red" }, "foo1"),
    ]);
    return h("div", { id: "root" }, [FooCpn]);
  },
};
```

​	此时，Foo 组件的这两个插槽内容并不会被渲染，因为此时 <a href='#插入单个节点_FooCpn'>Foo.js</a> 中的根节点的 children 已经变成了 `二维数组`，而类型为 `ShapFlags.ELEMENT` 的 vnode 只支持处理字符串或数组类型(`ShapFlags.TEXT_CHILDREN || ShapFlags.ARRAY_CHILDREN`)的 children。

​	因此我们可以来一波降维操作：

1. 利用展开运算符，将 $slots 降维
2. 利用 createVnode 创建一个类型为 `ShapFlags.ELEMENT` 的虚拟节点，并将 $slots 作为 children 传入，实现降维。（后续在 patch 这个节点时，本身就支持处理 array 类型的 children）

>​	推荐使用方法 2 ，因为使用 createVnode 可以让 render option 的返回结果格式更加统一，不管是根节点还是子节点，都可通过 createVnode 处理。
>
>​	而这种格式的统一，也更利于后续 compiler 模块的编写。

更新 <a href='#插入单个节点_FooCpn'>Foo.js</a> 中的内容如下：

Foo.js

```
const FooCpn = {
  render(h) {
    const fooTitle = h("p", {}, `FooCpn title`);
    // return h("div", { class: "foo-cpn" }, [fooTitle, ...this.$slots]);
    return h("div", { class: "foo-cpn" }, [
      fooTitle,
      h("div", {}, this.$slots),
    ]);
  },
};

export default FooCpn;
```

此时 Foo.js 就能以我们预期的效果进行渲染

<img src="实现组件的 slots 功能.assets/002.png" alt="002" style="zoom:80%;" />

#### 代码抽离

我们可以将降维的操作抽离出去，作为帮助渲染的工具函数。

runtime-core -> helpers -> <span id='插入多个节点_renderSlots'>renderSlots.ts</span>

```
import { createVNode } from "../createVNode";

export function renderSlots(slots) {
  return createVNode("div", {}, slots);
}
```

之后在 <span id='插入多个节点_FooCpn'>Foo.js</span> 中使用即可

```
import { renderSlots } from "../../lib/mini-vue.esm.js";

const FooCpn = {
  render(h) {
    const fooTitle = h("p", {}, `FooCpn title`);
    return h("div", { class: "foo-cpn" }, [fooTitle, renderSlots(this.$slots)]);
  },
};

export default FooCpn;
```

#### 插入单个节点失败

但细心的童鞋能够思考到，如果此时再把 <a href='#插入多个节点_AppCpn'>App.js</a> 切换为 <a href='#插入单个节点_AppCpn'>最初的版本</a>，插入单个节点的逻辑就会有问题。

*原因分析：*

​	当使用 createVnode 处理 slots 为单个节点的情况，如果该 vnode 被挂载，其实是会失败的。因为此时传入的 slots 本身就是个 vnode object，不符合（类型为 `ShapFlags.ELEMENT` 的 vnode 只支持处理字符串或数组类型(`ShapFlags.TEXT_CHILDREN || ShapFlags.ARRAY_CHILDREN`)的 children）的规则。

*解决：*

​	我们只需要判断当前的 slots 是不是数组，如果不是数组，那么就把它构建成数组即可。该逻辑可以在 <span id='插入多个节点_initSlots'>initSlots</span> 中实现：

```
export function initSlots(instance, children) {
  instance.slots = Array.isArray(children) ? children : [children];
}
```

### 根据名称插入到指定位置 (具名插槽)

#### 需求分析

​	既然要根据名称插入到指定位置，那就一定要维护一个 `插槽名` 和 `插槽内容` 之间的映射关系。因此我们需要改变一下 slots 的数据结构（由数组切换为字典）

<img src="实现组件的 slots 功能.assets/003.png" alt="003" style="zoom:80%;" />

所涉及到需要更改的地方

1. 在父组件中，向子组件的插槽插入内容时，也要以字典的数据结构传递，表明 `插槽名` 和 `插槽内容` 之间的关系
2. initSlots 时，根据 children (不管 children 是数组还是对象)，统一以字典的形式进行收集
3. renderSlots 支持接受 slotName，并根据 slotName 找出对应的插槽内容

#### 代码实现

更新 <a href='#插入多个节点_AppCpn'>App.js</a> 内容如下：

<span id='具名插槽_AppCpn'>App.js</span>

* 向 Foo 组件的插槽插入内容时，要以字典的数据结构传递

```
export const App = {
  render(h) {
    const FooCpn = h(
      Foo,
      {},
      {
        header: h("p", {}, "foo"),
        footer: h("p", { class: "red" }, "foo1"),
      }
    );
    return h("div", { id: "root" }, [FooCpn]);
  },
};
```

---

更新 <a href='#插入多个节点_initSlots'>initSlots</a> 内容如下：

<span id='具名插槽_代码实现_initSlots'>initSlots</span>

```
export function initSlots(instance, children) {
  const slots = {};
  for (const key in children) {
    const value = children[key];
    slots[key] = Array.isArray(value) ? value : [value];
  }
  instance.slots = slots;
}
```

---

更新 <a href='#插入多个节点_FooCpn'>Foo.js</a> 内容如下：

<span id='具名插槽_FooCpn'>Foo.js</span>

* 通过向 renderSlots 传入 slotName，实现向指定位置渲染

```
const FooCpn = {
  render(h) {
    const fooTitle = h("p", {}, `FooCpn title`);
    return h("div", { class: "foo-cpn" }, [
      renderSlots(this.$slots, "header"),
      fooTitle,
      renderSlots(this.$slots, "footer"),
    ]);
  },
};
```

---

更新 <a href='#插入多个节点_renderSlots'>renderSlots.ts</a> 内容如下：

<span id='具名插槽_renderSlots'>renderSlots</span>

```
export function renderSlots(slots, name) {
  const slot = slots[name];
  if (slot) {
    return createVNode("div", {}, slot);
  }
}
```

---

结果展示：可以发现，能够按照预期渲染 <a href='#具名插槽_FooCpn'>Foo.js</a>，向指定位置插入插槽内容。

<img src="实现组件的 slots 功能.assets/004.png" alt="004" style="zoom:80%;" />

#### 代码重构

更新 <a href='#具名插槽_代码实现_initSlots'>initSlots</a> 内容如下：

<span id='具名插槽_代码重构_initSlots'>initSlots</span>：将对数据特殊处理的逻辑进行抽离

* 将插槽内容统一初始化为 Array 的逻辑
* 将 instance.slots 收集为字典类型的逻辑

```
export function initSlots(instance, children) {
  normalizeObjectSlots(children, instance.slots);
}

function normalizeObjectSlots(children, slots) {
  for (const key in children) {
    const value = children[key];
    slots[key] = normalizeSlotValue(value);
  }
}

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
}
```

## 作用域插槽