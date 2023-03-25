import Foo from "./Foo.js";

export const App = {
  render(h) {
    const FooCpn = h(
      Foo,
      {},
      {
        header: h("p", {}, "foo"),
        footer: h("p", { class: "red" }, "foo1"),
      }
    );
    return h("div", { id: "root" }, [FooCpn]);
  },
};
