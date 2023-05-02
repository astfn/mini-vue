export const App = {
  setup() {
    //矩形相对于舞台的偏移量
    return { x: 10, y: 10 };
  },
  render(h) {
    return h("rectangle", { x: this.x, y: this.y });
  },
};
