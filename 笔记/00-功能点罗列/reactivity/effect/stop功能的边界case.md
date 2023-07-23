## 已经 stop 的 effect 依旧执行

### 分析问题

现有 effect 逻辑

```
import { extend } from "../shared";

function cleanupEffect(effect: ReactiveEffect) {
  effect.depsMap?.forEach((dep) => dep.delete(effect));
}

class ReactiveEffect {
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
    activeEffect = this;
    return this.#fn?.();
  }
  stop() {
    if (!this.isCleared) {
      cleanupEffect(this);
      this.onStop && this.onStop();
      this.isCleared = true;
    }
  }
}

let activeEffect: ReactiveEffect | undefined;

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
```

单测

* `obj.prop = 2` 触发 set，致使 effect 中的 callback 重新执行，更新 dummy 值为 2
* 调用 `stop` 取消 effect 中 callback 的收集
* `obj.prop = 3`，触发 set，但副作用函数已被清除依赖，effect 中的 callback 并不会 run，所以 `dummy === 2`
* 手动调用 `runner` ，dummy 值被更新为 3
* ✅ <span style="color:green">测试通过</span>

```
let dummy;
const obj = reactive({ prop: 1 });
const runner = effect(() => {
  dummy = obj.prop;
});
obj.prop = 2;
expect(dummy).toBe(2);
stop(runner);
obj.prop = 3;
expect(dummy).toBe(2);

// stopped effect should still be manually callable
runner();
expect(dummy).toBe(3);
```

失败单侧👇

* 把 `obj.prop = 3` 换成了 `obj.prop++`

```
let dummy;
const obj = reactive({ prop: 1 });
const runner = effect(() => {
  dummy = obj.prop;
});
obj.prop = 2;
expect(dummy).toBe(2);
stop(runner);
// obj.prop = 3;
obj.prop++;
expect(dummy).toBe(2);

// stopped effect should still be manually callable
runner();
expect(dummy).toBe(3);
```

debug：

* 执行完 effect 函数，全局缓存的 `activeEffect` 会被清空
* `obj.prop = 2` 触发 setter，从而执行之前缓存的 `effect.run`；而 `effect.run` **又将** `activeEffect`  **重新收集了起来**
* `stop(runner)`，将 effect 从 deps 中剔除
* `obj.prop++` 相当于 `obj.prop = obj.prop + 1`，该语句会先执行 `getter`，再执行 `setter`
* **执行 getter，deps 又会重新收集** `activeEffect` 
* 执行 setter, 会派发 deps 中的 effect.run
* 由于 deps 中依然存在之前的 `activeEffect` ，因此曾经被剔除掉的 effect callback 依旧会再次执行；导致 `dummy === 3` 而不是 `2`
* ❌<span style="color:red">测试失败 </span>

***失败核心流程***

1. 在 stop 之前触发过 trigger

   (activeEffect 在 effect.run 执行后再次被缓存)

2. 在 stop 之后先触发 getter 再触发 setter 

   (先触发 getter 导致 activeEffect 被重新收集到 deps 中; 再触发 setter 时，就会依次派发 deps 中的 effect)

只要不满足上述 *失败核心流程* 之一，就能够通过测试，例如: 👇(不满足条件1，在 stop 之前没有触发 trigger)

* 即便 `obj.prop++` 会先后触发 getter 与 setter；但在 getter 时，activeEffect 处于被清空状态，因此不会被重新收集进 deps

```
let dummy;
const obj = reactive({ prop: 1 });
const runner = effect(() => {
  dummy = obj.prop;
});

expect(dummy).toBe(1);
stop(runner);
obj.prop++;
expect(dummy).toBe(1);

// stopped effect should still be manually callable
runner();
expect(dummy).toBe(2);
```

回头再看看第一个能够通过的测试，其实是不满足条件2，stop 之后 直接通过 `obj.prop = 3` 触发了 trigger；虽然 activeEffect 已经被重新缓存了，但是并没有通过 track 收集到 deps 中。

### 解决问题

本质原因是：stop 之后，再次触发的 getter 依旧收集了有值的 activeEffect

我们期望：getter 在合适的时机，不进行依赖的收集

解决思路：定义一个开关 `shoudTrack`，用于记录是否需要进行 track

* 每次执行 `effect.fn` 之前，将 `shoudTrack` 置为 `true`；这样当 `effect.fn` 执行时，触发 track，就不会阻止依赖的收集
* 当 `effect.fn` 执行完毕后，将 `shoudTrack` 置为 `false`；这样后续再执行 track 时，就不会收集依赖

***代码实现***

```
let shouldTrack: boolean = true;
```

ReactiveEffect.run

```
run() {
    shouldTrack = true;
    activeEffect = this;
    const res = this.#fn?.();
    shouldTrack = false;
    return res;
}
```

track

```
export function track(target, key: string | symbol) {
  if (!shouldTrack || !activeEffect) return;
  ……
}

```

***优化点***

可以在 `ReactiveEffect.run` 中，判断当前 effect 是否已经被 stop 过，如果已经 stop 过，也就没有必要进行 activeEffect 的缓存，以及 shouldTrack 的维护

```
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
```

