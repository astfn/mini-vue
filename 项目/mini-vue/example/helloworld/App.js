import FooCpn from "./Foo.js";

export const App = {
  render(h) {
    return h("div", { id: "root" }, [
      h(FooCpn, { counter: 1, message: this.message }),
    ]);
  },
  setup() {
    return {
      message: "mini-vue",
    };
  },
};
// import FooCpn from "./Foo.js";

// window.self = undefined;
// export const App = {
//   render(h) {
//     window.self = this;
//     return h("div", { id: "root" }, [
//       h(
//         "span",
//         {
//           class: "red",
//           onClick: () => {
//             console.log("click");
//           },
//           onMousemove: () => {
//             console.log("mousemove");
//           },
//         },
//         "Ashun "
//       ),
//       h("span", { class: "green" }, " Ashuntefannao"),
//       h("p", { class: "green" }, this.message),
// h(FooCpn, { counter: 1, message: this.message }),
//     ]);
//   },
//   setup() {
//     return {
//       message: "mini-vue",
//     };
//   },
// };
