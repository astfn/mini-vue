const FooCpn = {
  setup(props) {
    //1.setup 接受props
    console.log(props);
    //3.props shallow readonly
    props.counter++;
    console.log(props.counter);
  },
  render(h) {
    //2. render 中可以通过this访问props中的property
    return h("div", { class: "foo-cpn" }, [
      h("p", {}, `foo : ${this.counter}`),
      h("p", {}, `parentCpn message: ${this.message}`),
    ]);
  },
};

export default FooCpn;
