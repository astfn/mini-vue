import FooCpn from "./Foo.js";

window.self = undefined;
export const App = {
  render(h) {
    window.self = this;
    return h("div", { id: "root" }, [
      h(
        "span",
        {
          class: "red",
          onClick: () => {
            console.log("click");
          },
          onMousemove: () => {
            console.log("mousemove");
          },
        },
        "Ashun "
      ),
      h("span", { class: "green" }, " Ashuntefannao"),
      h("p", { class: "green" }, this.message),
      h(FooCpn, {
        counter: 1,
        message: this.message,
        onAdd: (...args) =>
          console.log("add 事件触发成功！", this.message, args),
        onAddFoo: (...args) =>
          console.log("onAddFoo 事件触发成功！(蛇形名命)", this.message, args),
      }),
    ]);
  },
  setup() {
    return {
      message: "mini-vue",
    };
  },
};
