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
    ]);
  },
  setup() {
    return {
      message: "mini-vue",
    };
  },
};
