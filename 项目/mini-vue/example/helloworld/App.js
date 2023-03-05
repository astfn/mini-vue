export const App = {
  redner(h) {
    return h("div", "hi, " + this.message);
  },
  setup() {
    return {
      message: "mini-vue",
    };
  },
};
