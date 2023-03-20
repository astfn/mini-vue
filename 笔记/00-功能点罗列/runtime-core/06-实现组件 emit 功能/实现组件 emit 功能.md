### 需求探讨

***原理剖析***

​	列举一个最简单的 emit 场景：子组件 Child 点击按钮触发了 `emit('add')`，而在父组件 App 中使用 Child 时，需要侦听该组件的触发 `<Child onAdd='onAddCallback'/>`。

​	当调用 `emit('add')` 时，就会自动调用 `onAddCallback`。也就是说：触发 `emit` 实际上就是调用 props 传递进来的函数。

​	是不是感觉似曾相识？没错！我们在用 React 时不就是这么玩的嘛！只不过 vue 在此基础上加了点料，使得我们用起来感觉很神奇。这点料是啥呢？

​	其实就是 emit 触发的事件名称与 props 中所传递的事件名称在形式上不一致罢了。但它也是有语法规则的：

* emit 的事件名称最终会被转化为事件句柄的驼峰命名形式，然后再与 props 进行匹配
* 当然了，emit 的时间名还支持传递蛇形名命形式（`xxx-yyy`）

***实现过程的需求点***

1. setup option 的第二个参数 context 中包含 emit 工具函数
2. 调用 emit 函数时，支持传递 payload，并能在事件侦听处拿到
3. emit 的事件名要解析为事件句柄的驼峰命名形式

### 代码实现

`createComponentInstance`

​	在初始化组件实例时，把 emit 工具函数挂载到 instance 上，方便后续使用。

注意点：

* 由于 emit 工具函数中，需要与 props 进行匹配，所以需要把 instance 实例传入，但又希望用户使用时，只需要传递 emitName，所以这里使用 bind 将 instance 预传入，

```
import { emit } from "./componentEmit";

export function createComponentInstance(vnode) {
  const defaultEmit: Function = () => {};
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    render: undefined,
    proxy: undefined,
    emit: defaultEmit,
  };
  component.emit = emit.bind(null, component);
  return component;
}
```

`setupStatefulComponent`

setup option 调用时，将 emit 工具函数传入到第二个参数 context 中。

```
const setupResult = setup(shallowReadonly(instance.props), {
  emit: instance.emit,
});
```

`componentEmit.js`

​	将 emit 的具体逻辑抽离到独立的文件中。

主要功能点：

1. 支持 capitalize （使首字母大写），再结合 toHandlerKey 拼接 `on` 前缀，从而将普通的事件名称解析为事件句柄的驼峰命名形式
2. 支持 camelize（使得成为驼峰形式），用于将蛇形名命`xxx-yyy` 解析为小驼峰 `xxxYyy`
3. emit 工具函数支持接受 payload，并在调用 props 对应事件时，传递进去

巧妙点：

* 在 toHandlerKey 时，先将 eventName 使用 camelize 预处理一下：
  * 如果传入的是蛇形名命法，则会先转成小驼峰
  * 如果不是，代表传入的是普通的事件名称，由于 replace 匹配不到，就会原样返回
* 最终通过 toHandlerKey 拼接 on，并使得传入的 str 首字母大写，所得到的结果都是事件句柄的驼峰命名形式。

这种 compose（组合）的调用形式，不仅能将功能模块拆分开，更能让代码变得简洁易懂

```
export function emit(instance, event, ...args) {
  const { props } = instance;

  const camelize = (str: string) => {
    return str.replace(/-(\w)/g, (_matchRes, matchGroup) => {
      return matchGroup ? matchGroup.toUpperCase() : "";
    });
  };

  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  const toHandlerKey = (str: string) => {
    return str ? "on" + capitalize(str) : "";
  };
  
  const handlerName = toHandlerKey(camelize(event));
  const handler = props[handlerName];
  handler && handler(...args);
}
```

### 结果演示

示例代码：

App.js

```
import FooCpn from "./Foo.js";

export const App = {
  render(h) {
    return h("div", { id: "root" }, [
      h(FooCpn, {
        onAdd: (...args) =>
          console.log("add 事件触发成功！", this.message, args),
        onAddFoo: (...args) =>
          console.log("onAddFoo 事件触发成功！(蛇形名命)", args),
      }),
    ]);
  },
  setup() {
    return {
      message: "mini-vue",
    };
  },
};
```

Foo.js

```
const FooCpn = {
  setup(props, { emit }) {
    const handleAdd = () => {
      emit("add", "FooCpn emit add event", 2, 3);
      emit("add-foo", "FooCpn emit add-foo event", 4, 5);
    };

    return {
      handleAdd,
    };
  },
  render(h) {
    return h("div", { class: "foo-cpn" }, [
      h("p", { onClick: this.handleAdd }, `FooCpn text`),
    ]);
  },
};

export default FooCpn;
```

期望结果：

<img src="实现组件 emit 功能.assets/001.gif" alt="001" style="zoom:80%;" />