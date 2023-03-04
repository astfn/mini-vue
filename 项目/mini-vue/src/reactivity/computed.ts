import { ReactiveEffect } from "./effect";

class ComputedRefImpl {
  #getter;
  #dirty = false;
  #value;
  constructor(getter) {
    this.#getter = new ReactiveEffect(getter, {
      scheduler: () => {
        if (this.#dirty) this.#dirty = false;
      },
    });
  }
  get value() {
    if (!this.#dirty) {
      this.#dirty = true;
      this.#value = this.#getter.run();
    }
    return this.#value;
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter);
}
