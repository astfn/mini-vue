import Foo from "./Foo.js";
import { createTextVNode } from "../../lib/mini-vue.esm.js";

export const App = {
  render(h) {
    const FooCpn = h(
      Foo,
      {},
      {
        header: ({ message }) => [
          h("p", {}, `foo -- ${message}`),
          createTextVNode("Ashuntefannao"),
        ],
        footer: () => h("p", { class: "red" }, "foo1"),
      }
    );
    return h("div", { id: "root" }, [FooCpn]);
  },
};
