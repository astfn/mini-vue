class ReactiveEffect {
  #fn: Function | undefined;
  constructor(fn: Function) {
    this.#fn = fn;
  }
  run() {
    activeEffect = this;
    this.#fn?.();
    activeEffect = undefined;
  }
}

let activeEffect: ReactiveEffect | undefined;

export function effect(fn: Function) {
  let _efect = new ReactiveEffect(fn);
  _efect.run();
}

const targetMap: Map<
  any,
  Map<string | symbol, Set<ReactiveEffect>>
> = new Map();

export function track(target, key: string | symbol) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let deps = depsMap.get(key);
  if (!deps) {
    deps = new Set();
    depsMap.set(key, deps);
  }
  activeEffect && deps.add(activeEffect);
}

export function trigger(target, key: string | symbol) {
  let depsMap = targetMap.get(target)!;
  let deps = depsMap.get(key);
  deps?.forEach((effect) => effect.run());
}
