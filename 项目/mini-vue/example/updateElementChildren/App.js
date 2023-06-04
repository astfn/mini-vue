// import TextToArray from "./TextToArray.js";
// import TextToText from "./TextToText.js";
// import ArrayToText from "./ArrayToText.js";
import ArrayToArray from "./ArrayToArray.js";

export const App = {
  render(h) {
    return h("div", {}, [
      h("h2", {}, `updateElementChildren`),
      h(ArrayToArray),
    ]);
  },
};
