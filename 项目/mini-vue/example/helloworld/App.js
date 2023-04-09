import { provide, inject, getCurrentInstance } from "../../lib/mini-vue.esm.js";

const NestChildCpn = {
  name: "NestChild",
  render(h) {
    const nestChildCpnTitle = h("h2", {}, `nestChildCpn title`);
    const injectMessage = h("span", {}, `${this.injectMessage}`);
    return h("div", { id: "nest-child" }, [nestChildCpnTitle, injectMessage]);
  },
  setup() {
    const injectMessage = inject("foo");
    return { injectMessage };
  },
};

const ChildCpn = {
  name: "Child",
  render(h) {
    const childCpnTitle = h("h2", {}, `ChildCpn title`);
    const injectMessage = h("span", {}, `${this.injectMessage}`);
    const NestChild = h(NestChildCpn);
    return h("div", { id: "child" }, [childCpnTitle, injectMessage, NestChild]);
  },
  setup() {
    provide("foo", "ChildCpn provide state");
    const injectMessage = inject("foo");
    console.log(getCurrentInstance());
    return { injectMessage };
  },
};

export const App = {
  name: "App",
  render(h) {
    const appTitle = h("h1", {}, `App`);
    const Child = h(ChildCpn);
    return h("div", { id: "root" }, [appTitle, Child]);
  },
  setup() {
    provide("foo", "foo provide state");
    console.log(getCurrentInstance());
  },
};
