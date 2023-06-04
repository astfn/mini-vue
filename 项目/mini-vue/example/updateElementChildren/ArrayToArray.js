import { useState } from "./hooks.js";

export default {
  setup() {
    const [convert, setConvert] = useState(false);
    window.setConvert = setConvert;
    return {
      convert,
      setConvert,
    };
  },
  render(h) {
    const oldArray = [1, 2, 3];
    const newArray = [2, 3, 4];
    const targetChildren = (this.convert ? newArray : oldArray).map((item) =>
      h("li", {}, item)
    );
    return h("div", {}, [
      h("button", { onClick: () => this.setConvert(true) }, "ArrayToArray"),
      h("ul", {}, targetChildren),
    ]);
  },
};
