import { ref } from "../../lib/mini-vue.esm.js";

export const App = {
  setup() {
    const rootNodeProps = ref({
      class: "green",
    });

    const changeClassProps = () => {
      rootNodeProps.value.class = "red";
    };
    const deleteClassProps = () => {
      rootNodeProps.value.class = undefined;
    };
    const addFooProps = () => {
      rootNodeProps.value = {
        class: rootNodeProps.value.class,
        foo: "foo",
      };
    };

    return { rootNodeProps, changeClassProps, deleteClassProps, addFooProps };
  },
  render(h) {
    const changeClassPropsBtn = h(
      "button",
      {
        onClick: this.changeClassProps,
      },
      `changeClassProps`
    );

    const deleteClassPropsBtn = h(
      "button",
      {
        onClick: this.deleteClassProps,
      },
      `deleteClassProps`
    );

    const addFooPropsBtn = h(
      "button",
      {
        onClick: this.addFooProps,
      },
      `addFooProps`
    );

    return h("div", { ...this.rootNodeProps }, [
      h("p", {}, `Ashuntefannao`),
      changeClassPropsBtn,
      deleteClassPropsBtn,
      addFooPropsBtn,
    ]);
  },
};
