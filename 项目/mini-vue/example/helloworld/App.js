import Foo from "./Foo.js";

export const App = {
  render(h) {
    const FooCpn = h(
      Foo,
      {},
      {
        header: ({ message }) => h("p", {}, `foo -- ${message}`),
        footer: () => h("p", { class: "red" }, "foo1"),
      }
    );
    return h("div", { id: "root" }, [FooCpn]);
  },
};
