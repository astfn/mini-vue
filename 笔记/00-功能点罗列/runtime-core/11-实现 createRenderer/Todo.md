### 功能实现

1. 关于 dom 的操作，不依赖于具体的原生dom方法，而是切换为稳定的 api ，这些 api 支持外部传入，实现可以兼容其他平台渲染逻辑的功能

   * createElement、patchProps、insertNode

2. 不再直接暴露 render，而是让 createRenderer 函数将原有的 render 逻辑进行包裹（利用闭包接收外部传入的 options），并把 createRenderer 暴露出去

3. 将默认支持的渲染 dom 逻辑抽离到 runtime-dom -> index.ts

   ```
   tsconfig.json
   "moduleResolution": "node"  //使用 node 的模块解析规则（当引入某个文件夹时，默认引入其中的 index.ts 文件）
   ```

   

4. 正确导出 createApp 方法

   1. createApp -> createAppAPI(render)
   2. createRenderer 返回出去被调用过的 createAppAPI 方法，也就是原有的 createApp 方法
   3. runtime-dom 中导出 renderer.createApp(...args)

### 试用 createRenderer

基于 canvas 平台渲染元素，利用 `pixiJs` (一个 H5 游戏引擎库) 快速搭建。

1. 编写基础代码
   * 引入 createRenderer，并在使用时传入 option，利用 createRenderer 所返回的 createApp 创建 vue 应用
   * 编写 App.js (vue app的根组件)，并在其中通过 h 函数创建一个 `ShapeFlags.ELEMENT` 类型的 vnode
2. 引入 `pixiJs`，并在 createRenderer 的 options 中使用 `pixiJs` 提供的 api 完成元素的创建、属性设置、追加元素过程。

