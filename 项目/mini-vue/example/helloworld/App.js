export const App = {
  render(h) {
    return h("div", { id: "root" }, [
      h("span", { class: "red" }, "Ashun "),
      h("span", { class: "green" }, " Ashuntefannao"),
    ]);
  },
  setup() {
    return {
      message: "mini-vue",
    };
  },
};
