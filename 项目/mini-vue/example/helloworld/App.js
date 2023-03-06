export const App = {
  render(h) {
    return h("div", "hi, " + this.message);
  },
  setup() {
    return {
      message: "mini-vue",
    };
  },
};
