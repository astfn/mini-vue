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
    const targetChildren = this.convert
      ? "Ashuntefannao"
      : [1, 2, 3].map((item) => h("li", {}, item));

    return h("div", {}, targetChildren);
  },
};
