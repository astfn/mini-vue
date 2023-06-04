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
    const newArrayVNodes = [1, 2, 3].map((item) => h("li", {}, item));
    const targetChildren = this.convert ? newArrayVNodes : "Ashuntefannao";

    return h("div", {}, targetChildren);
  },
};
