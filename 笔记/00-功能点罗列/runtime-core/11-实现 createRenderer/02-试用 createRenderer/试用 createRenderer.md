​	前面我们已经实现了 createRenderer，现在我们来通过一个小 example 去试用它，我们以在 canvas 平台渲染元素为例，基于 [PixiJS](https://pixijs.com/)(一个 H5 游戏引擎库) 快速搭建。

在应用的入口页面文件 `index.html`，引入依赖库 [PixiJS](https://pixijs.com/):

```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <script src="./main.js" type="module"></script>
    <script src="https://pixijs.download/release/pixi.js"></script>
  </body>
</html>

```

在应用的脚本入口文件 `main.js` 中，编写基础逻辑代码：

1. 引入 createRenderer，并在使用时传入 option，利用 createRenderer 所返回的 createApp 创建 vue 应用
2. 引入 `pixiJs`，并在 createRenderer 的 options 中使用 `pixiJs` 提供的 api 完成元素的创建、属性设置、追加元素过程。

```
import { createRenderer } from "../../lib/mini-vue.esm.js";
import { App } from "./App.js";

//创建 pixi 应用
const game = new PIXI.Application({ width: 300, height: 300 });
//将 pixi 的视图添加到页面上
document.body.appendChild(game.view);

const { createApp } = createRenderer({
  createElement(type) {
    if (type === "rectangle") {
      const rectangle = new PIXI.Graphics();
      rectangle.beginFill(0xff0000);
      rectangle.drawRect(0, 0, 100, 100);
      rectangle.endFill();
      return rectangle;
    }
  },
  patchProps(el, key, value) {
    el[key] = value;
  },
  insert(el, container) {
    container.addChild(el);
  },
});

//将 vue 组件挂载到 pixi 的舞台上
createApp(App).mount(game.stage);
```

编写 App.js (vue app的根组件)，并在其中通过 h 函数创建一个 `ShapeFlags.ELEMENT` 类型的 vnode，并为该 vnode 设置一些 props。

```
export const App = {
  setup() {
    //矩形相对于舞台的偏移量
    return { x: 10, y: 10 };
  },
  render(h) {
    return h("rectangle", { x: this.x, y: this.y });
  },
};
```

结果展示:

* 现在已经将整个应用渲染到 canvas 平台上了

<img src="试用 createRenderer.assets/001.png" alt="001" style="zoom:80%;" />

