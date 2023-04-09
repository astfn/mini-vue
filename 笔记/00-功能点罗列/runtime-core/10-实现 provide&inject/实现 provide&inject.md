## 需求分析

​	provide & inject，实际上就是存数据和取数据的过程，并且支持跨层级共享 state。

​	根据其支持跨层级共享 state 的特性，每个组件实例中都单独需存储一个 provides，用于保存给子树组件共享的 state，当子树中的组件调用 inject 方法时，只需要通过攀爬组件树<span style="color:#aaa;font-size:14px">(可以利用一些巧思，让我们不必手动攀爬父级组件树)</span>，来找到与 key 相匹配的共享 state 即可。

​	由于需要不断访问父级组件，因此还需要在组件实例中保存父级组件实例。

## 实现父子共享

### 案例代码

App.js

```
import { provide, inject } from "../../lib/mini-vue.esm.js";

const ChildCpn = {
  name: "Child",
  render(h) {
    const childCpnTitle = h("h2", {}, `ChildCpn title`);
    const injectMessage = h("span", {}, `${this.injectMessage}`);
    return h("div", { id: "child" }, [childCpnTitle, injectMessage]);
  },
  setup() {
    const injectMessage = inject("foo");
    return { injectMessage };
  },
};

export const App = {
  name: "App",
  render(h) {
    const appTitle = h("h1", {}, `App`);
    const Child = h(ChildCpn);
    return h("div", { id: "root" }, [appTitle, Child]);
  },
  setup() {
    provide("foo", "foo provide state");
  },
};
```

### 功能实现

#### provide & inject

将 provide & inject 的具体逻辑，抽离到 runtime-core -> apiInject.ts 中

* provide：把共享的 state，存入当前组件实例的 provides 中
* inject：从父级组件实例当中的 provides 中取得 key 对应的 state

```
import { getCurrentInstance } from "./component";

export function provide(key, value) {
  const currentInstance = getCurrentInstance();
  if (currentInstance) {
    const { provides } = currentInstance;
    provides[key] = value;
  }
}

export function inject(key) {
  const currentInstance = getCurrentInstance();
  if (currentInstance) {
    const parentProvides = currentInstance.parent.provides;
    return parentProvides[key];
  }
}
```

#### parent component instance

​	在现有的组件实例代码逻辑中，没有 provides，以及对父级组件实例的存储，因此我们要弥补这两个缺漏。 

​	在 createComponentInstance 中，给 provides 赋予初始值（空对象），并且还要将父级组件实例存储一下

```
export function createComponentInstance(vnode, parent) {
  const defaultEmit: Function = () => {};
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    render: undefined,
    proxy: undefined,
    props: {},
    slots: {},
    provides: {},
    parent,
    emit: defaultEmit,
  };
  component.emit = emit.bind(null, component);
  return component;
}
```

由于 createComponentInstance 中不能够直接获取到父级组件实例，因此需要外部传入，涉及到的改动点如图：

<img src="实现 provide&inject.assets/001.png" alt="存储父级组件实例" style="zoom:80%;" />

由于 setupRenderEffect 就是用于挂载组件的子树的，因此要把当前组件实例作为子组件的父级组件实例传递进去。

完成上述更改后，即可看到结果可以达到预期：

<img src="实现 provide&inject.assets/002.png" alt="002" style="zoom:80%;" />

## 跨层级共享

### 案例代码

<span id='基本实现_案例代码'>App.js</span>

```
import { provide, inject } from "../../lib/mini-vue.esm.js";

const NestChildCpn = {
  name: "NestChild",
  render(h) {
    const nestChildCpnTitle = h("h2", {}, `nestChildCpn title`);
    const injectMessage = h("span", {}, `${this.injectMessage}`);
    return h("div", { id: "nest-child" }, [nestChildCpnTitle, injectMessage]);
  },
  setup() {
    const injectMessage = inject("foo");
    return { injectMessage };
  },
};

const ChildCpn = {
  name: "Child",
  render(h) {
    const childCpnTitle = h("h2", {}, `ChildCpn title`);
    const injectMessage = h("span", {}, `${this.injectMessage}`);
    const NestChild = h(NestChildCpn);
    return h("div", { id: "child" }, [childCpnTitle, injectMessage, NestChild]);
  },
  setup() {
    const injectMessage = inject("foo");
    return { injectMessage };
  },
};

export const App = {
  name: "App",
  render(h) {
    const appTitle = h("h1", {}, `App`);
    const Child = h(ChildCpn);
    return h("div", { id: "root" }, [appTitle, Child]);
  },
  setup() {
    provide("foo", "foo provide state");
  },
};
```

### 基本实现

单纯实现跨层级共享，还是很简单的：我们只需要把各组件的 provides 初始化为父级组件的 provides，这样 provides 就不断被继承了下去。

<img src="实现 provide&inject.assets/003.png" alt="003" style="zoom:60%;" />



在 createComponentInstance 中，更改为 provides 设置初始值的逻辑

```
provides: parent ? parent.provides : {}
```

最后可以发现，代码执行结果已经符合我们的预期了

<img src="实现 provide&inject.assets/004.png" alt="004" style="zoom:80%;" />

### 发现问题

​	其实有些同学已经发现端倪了，上文实现 provides 不断继承到子组件的行为是危险的。因为后续所有子树组件拿到的都是根组件的 provides，这就意味着，子组件中如果再次 provide 了相同的 key，那么根组件中 provides 对应 key 的值也会发生改变，因为大家使用的 provides 都是同一个引用。 

在实际使用时，映射的 bug 场景为：

* 组件本身既 provide 了一个 key，又同时 inject 了这个 key。并且祖先组件也 provide 了这个 key。此时就会引发：当前组件 inject 的内容是自己 provide 的内容。

**案例代码**

更新上文 <a href='#基本实现_案例代码'>App.js</a> 中 ChildCpn 代码：

* 在 inject 根组件所 provide 的 foo 的同时，自身也 provide 了同一个 key 给子树组件

```
const ChildCpn = {
  ……
  setup() {
    provide("foo", "ChildCpn provide state");
    const injectMessage = inject("foo");
    return { injectMessage };
  },
};
```

代码结果：

<img src="实现 provide&inject.assets/005.png" alt="005" style="zoom:80%;" />

* 由于在 ChildCpn 中污染了 App 组件的 provides，因此 ChildCpn 所 inject 的状态会不符合预期。
* 这种污染，虽然在结果上不会影响 ChildCpn 子树的共享结果 <span style='color:#aaa;font-size:14px'>(因为我们想实现的 inject 特性就是如此：不断向父级组件攀爬，一旦找到了对应的 key，就不再往上寻找了)</span>，但基于现有的实现形式，由于 provides 都是同一个引用，实际上 nestChildCpn 所 inject 的 state 就是 App 组件的，只不过它已经被污染了。

### 完美实现

根据 inject 的使用特性，发现其访问 provides 中某个 key 的逻辑与 js 原型链特性一致：

* 先访问组件自身的 provides 中有没有这个 key，如果没有，则不断向父级攀爬进行访问，直到根组件
* 当向自身的 provides 压入新的 key 时，不会影响父级组件的 provides。

因此，我们只需在初始化组件自身的 provides 时利用 Object.create 方法创建一个纯字典，并指定其父级原型对象为父组件的 provides 即可。

这个逻辑可以放在 provide 函数中

* 当 `provides === parentProvides`，意味着第一次在某组件中使用 provide，因为当前组件实例的 provides 默认值为父组件的 provides。此时我们创建一个全新的字典，并设置其父级原型对象为父组件的 provides。

```
export function provide(key, value) {
  const currentInstance = getCurrentInstance();
  if (currentInstance) {
    let { provides } = currentInstance;
    const parentProvides = currentInstance.parent?.provides;
    if (provides === parentProvides) {
      provides = currentInstance.provides = Object.create(parentProvides);
    }
    provides[key] = value;
  }
}
```

此时 run 一下代码，并打印一下 App、ChildCpn 组件，发现功能完美实现：

<img src="实现 provide&inject.assets/006.png" alt="006" style="zoom:80%;" />