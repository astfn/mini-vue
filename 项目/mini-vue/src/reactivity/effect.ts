import { extend } from "../shared";

let activeEffect: ReactiveEffect | undefined;
let shouldTrack: boolean = true;

function isTracking() {
  return activeEffect !== undefined && shouldTrack;
}

function cleanupEffect(effect: ReactiveEffect) {
  effect.depsMap?.forEach((dep) => dep.delete(effect));
}

export class ReactiveEffect {
  #fn: Function | undefined;
  scheduler: Function | undefined;
  depsMap: Map<string | symbol, Set<ReactiveEffect>> | undefined;
  isCleared: boolean = false;
  onStop: Function | undefined;

  constructor(fn: Function, options?: EffectOptions) {
    this.#fn = fn;
    options && extend(this, options);
  }
  run() {
    if (this.isCleared) {
      return this.#fn?.();
    }
    shouldTrack = true;
    activeEffect = this;
    const res = this.#fn?.();
    shouldTrack = false;

    return res;
  }
  stop() {
    if (!this.isCleared) {
      cleanupEffect(this);
      this.onStop && this.onStop();
      this.isCleared = true;
    }
  }
}

export type EffectOptions = {
  scheduler?: Function;
  onStop?: Function;
};
export function effect(fn: Function, options?: EffectOptions) {
  let _effect = new ReactiveEffect(fn, options);
  _effect.run();
  activeEffect = undefined;
  const runner = _effect.run.bind(_effect) as any;
  runner.effect = _effect;
  return runner;
}

const targetMap: Map<
  any,
  Map<string | symbol, Set<ReactiveEffect>>
> = new Map();

export function track(target, key: string | symbol) {
  if (!isTracking()) return;
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
  deps.add(activeEffect!);
  activeEffect!.depsMap = depsMap;
}

export function trigger(target, key: string | symbol) {
  let depsMap = targetMap.get(target)!;
  let deps = depsMap?.get(key);
  deps?.forEach((effect) => {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  });
}

export function stop(runner) {
  runner.effect.stop();
}
