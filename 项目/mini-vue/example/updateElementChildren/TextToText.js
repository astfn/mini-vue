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
    const targetChildren = this.convert ? "new-Ashuntefannao" : "Ashuntefannao";

    return h("div", {}, targetChildren);
  },
};
