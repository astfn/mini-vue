import { ref } from "../../lib/mini-vue.esm.js";

export const App = {
  setup() {
    const count = ref(0);
    const increment = () => {
      count.value += 1;
    };
    return { count, increment };
  },
  render(h) {
    return h("div", {}, [
      h("p", {}, `count: ${this.count}`),
      h(
        "button",
        {
          onClick: () => {
            this.increment();
          },
        },
        `count + 1`
      ),
    ]);
  },
};
