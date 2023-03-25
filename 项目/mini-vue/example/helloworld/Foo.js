import { renderSlots } from "../../lib/mini-vue.esm.js";

const FooCpn = {
  render(h) {
    const fooTitle = h("p", {}, `FooCpn title`);
    // return h("div", { class: "foo-cpn" }, [fooTitle, ...this.$slots]);
    return h("div", { class: "foo-cpn" }, [
      renderSlots(this.$slots, "header"),
      fooTitle,
      renderSlots(this.$slots, "footer"),
    ]);
  },
};

export default FooCpn;
