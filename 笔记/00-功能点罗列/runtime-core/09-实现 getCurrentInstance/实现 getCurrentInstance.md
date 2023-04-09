### who？

​	getCurrentInstance 工具函数，用于获取当前组件的实例对象。它的用法很简单，直接在 setup option 中调用即可，不需要传递任何参数。

>值得注意的是：getCurrentInstance 规定只能在 setup option 中调用才能够正常获取到当前组件实例。

### 实现思路

其实单从 getCurrentInstance 使用过程来说，还是比较神奇的，因为它有两个特点：

1. 这个方法可能会在多个组件内使用；而且在某个组件内使用时，不需要传递任何参数，就能够获取到当前组件实例
2. 只有在 setup option 中才能正常使用，在其他地方访问不到。

给人的感觉是：使用起来不仅没什么负担，而且还附加上了调用位置的约束，很神奇。

***要实现这种骚操作，其实只需要一个全局变量即可***

​	定义一个全局变量 `currentInstance`，当 setupStatefulComponent 中执行 setup option 之前，我们把当前的组件实例赋值给 `currentInstance`<span style="font-size:14px;color:#aaa"> (此操作保证 getCurrentInstance 每次获取的都是当前组件实例)</span>。

​	然后当 setup option 执行逻辑走完后，再把  `currentInstance` 给清空掉即可<span style="font-size:14px;color:#aaa">（此操作保证在 setup option 之外使用 getCurrentInstance 将获取不到组件实例）</span>

最后，实现 getCurrentInstance 方法，将 currentInstance 返回出去即可。

### 代码实现

操作的文件：runtime-core -> component.ts

定义 currentInstance 全局变量，并提供 set 的方法

```
let currentInstance = null

function setCurrentInstance(instance){
  currentInstance = instance
} 
```

setupStatefulComponent

```
function setupStatefulComponent(instance) {
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
  const Component = instance.type;
  const { setup } = Component;
  if (setup) {
  	setCurrentInstance(instance)
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    });
    setCurrentInstance(null)
    handleSetupResult(instance, setupResult);
  } else {
    finishComponentSetup(instance);
  }
}
```

getCurrentInstance

```
export function getCurrentInstance() {
  return currentInstance;
}
```

