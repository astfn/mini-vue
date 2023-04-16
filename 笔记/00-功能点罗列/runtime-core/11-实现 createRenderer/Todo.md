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