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
