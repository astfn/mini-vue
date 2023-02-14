class ReactiveEffect {
  #fn: Function | undefined;
  constructor(fn: Function) {
    this.#fn = fn;
  }
  run() {
    this.#fn?.();
  }
}

let currentEffect: ReactiveEffect | undefined;

export function effect(fn: Function) {
  currentEffect = new ReactiveEffect(fn);
  currentEffect.run();
  currentEffect = undefined;
}
