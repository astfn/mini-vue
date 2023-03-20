const FooCpn = {
  setup(props, { emit }) {
    const handleAdd = () => {
      emit("add", "FooCpn emit add event", 2, 3);
      emit("add-foo", "FooCpn emit add-foo event", 4, 5);
    };

    return {
      handleAdd,
    };
  },
  render(h) {
    return h("div", { class: "foo-cpn" }, [
      h("p", { onClick: this.handleAdd }, `FooCpn text`),
    ]);
  },
};

export default FooCpn;
