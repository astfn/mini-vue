import { renderSlots, getCurrentInstance } from "../../lib/mini-vue.esm.js";

const FooCpn = {
  name: "Foo",
  render(h) {
    const fooTitle = h("p", {}, `FooCpn title`);
    // return h("div", { class: "foo-cpn" }, [fooTitle, ...this.$slots]);
    return h("div", { class: "foo-cpn" }, [
      renderSlots(this.$slots, "header", { message: "hello" }),
      fooTitle,
      renderSlots(this.$slots, "footer"),
    ]);
  },
  setup() {
    console.log(getCurrentInstance());
  },
};

export default FooCpn;
