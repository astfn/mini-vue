* example 代码编写，需要解决的问题
  1. 在 template (render函数) 中，解包 ref，防止页面渲染 `[object Object]`
     * 方案：在 render 函数中通过 this 访问的响应式变量来源于 setup option object result（this 实际上是组件实例 instance 的 proxy 代理对象，通过这个 proxy 间接访问组件实例暴露的各种 api），因此我们只需要使用 `proxyRefs` 去代理组件实例中的 setupState 即可。
* 更新流程核心思想：
  * 当触发更新时，要生成一个新的 vnode tree ，后期再让这个 new vnode tree 与 old vnode tree 进行比较，将发生改变的地方进行更新。
  * 当然，具体怎么比较是一个算法问题，我们可以先不关注这个具体细节实现，先着重考虑如何拿到新旧 vnode tree
  * vnode tree 的数据源是 component 的 render option，而 runtime-core 调用 redner option 的地方在 `setupRenderEffect` 中
  * 因此当 state 变更时，我们期望重新执行 component 的 render option 从而拿到最新的 vnode tree
* 将 reactivity 与 runtime 连接起来
  * 在实现 reactivity 时，我们知道：像 reactive、ref 这种响应式数据，当数据发生变更时，会完成事件的发布，而 effect 函数用于收集这些响应式数据所依赖事件。effect + 响应式变量，能够完成发布订阅的整个流程。
  * 依据现在的需求（当 state 变更时，我们期望重新执行 component 的 render option 从而拿到最新的 vnode tree），我们应该将 render option 执行的逻辑使用 effect 订阅，当 state 变更时，就会发布事件，从而再次执行 effect 中所订阅的逻辑，就能够拿到最新的 vnode。

