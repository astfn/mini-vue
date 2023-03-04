### reactive

#### reactive

* getter
  * track
* setter
  * trigger
  
* 衍生功能点
  * isReactive（通过构建一个虚拟的key实现）
* 边界情况
  - [ ] 嵌套代理：`reactive(reactive(obj))`
  - [ ] 重复代理：`let a = reactive(obj)`；`let b = reactive(obj)`；`a===b`
  - [ ] 真实改变才触发set，实现 `hasChanged`
  - [ ] 对象深层代理
  - [ ] 代理数组

#### readonly

* getter（不需要track）
* setter（不需要真实地进行Reflect.set，在return之前抛出警告）
* 实现 readonly 后，可以将 reactive 与 readonly 的代码进行重构，将公共部分抽离
* 衍生功能点
  * isReadonly（通过构建一个虚拟的key实现）
* 边界情况
  - [ ] 对象深层代理

### effecct

* 非惰性调用 fn，触发 reactive 的 getter
*  利用 Map<Objcte,Map<string|symbol，ReactiveEffect>> 缓存所有副作用函数
* effect 需返回 runner
* 支持 scheduler
* stop 函数；onStop option
* 边界情况
  - [ ] 嵌套effect

### ref

* 实现 class RefImpl
  * get value (track)
  * set value (trigger)
    * isChanged
* 衍生功能点
  * isRef
  * unRef
  * proxyRefs
* 边界情况
  * 传入 Object，转化为 reactive
  * 由于 value 可能是 reactive，所以在进行 isChanged 比较时，需要与未经处理的 rawValue 比较

### computedRef

***缓存功能***

我们知道，在使用vue2.x时，就一直强调computed的缓存功能。即便在template中多次使用，如果所依赖的响应式变量没有改变，则computed的callback就不会重新执行，而是返回上次执行结果的缓存值。这点就与methods不同，methods只要调用，就会乖乖执行。

在实现vue3的computed功能函数时，缓存功能具体体现为：

```
const user = reactive({ name: 'Ashun', age: 18 })
const computedAge = computed(()=>user.age)
```

* 默认不执行 callback ，因为一开始并没有地方使用 computedAge，也就没有执行的必要。（性能思考点）
* 第一次访问 computedAge.value 触发 callback，但如果 user.age 没有改变，就再次访问 computedAge.value，则返回上次缓存的值（性能思考点）
* **user.age 发生改变，callback 也不会执行**
* 只有当再次访问 computedAge.value 时，callback 才执行，更新缓存值。

***实现过程的关键思考点***

​	需要侦听响应式数据源的改变，从而决定是否执行 callback。这个功能我们已经实现了，就是 `effect`。

但很显然，我们不能直接使用 effect ，因为 computed 的功能与 effect 不同，例如：

* effect callback 会非惰性调用
* effect 返回的结果是 fn

但是我们可以复用之前封装好的 ReactiveEffect 这个类的核心功能，来实现 computed。

之前在实现 ReactiveEffect 时，有一些功能和写法，都为 computed 打下基础，例如：

1. 支持 scheduler

2. 标记 activeEffect 的功能，放到了该类的 run 函数内部，这在目前有两个好处
   1. 在实际场景的代码执行过程中，会有多个 effect 依次执行的情况，而把收集 activeEffect 的功能放到 run 函数内部，就能够准确标记当前活跃的 effect

   2. 复用 ReactiveEffect 时，能够无缝与响应式变量的收集进行衔接

      >例如在一个函数 fn 中，使用了响应式变量。而在实例化 ReactiveEffect 时，把 fn 传递了进去，那么一旦执行了 effect.run ，就会触发响应式变量的 get，从而触发track，而tarck收集的是 activeEffect 。当effect.run执行 fn 之前，就已经成功标记了 activeEffect，从而能够让响应式变量的副作用函数能够正常被收集。

关于 2.2：

* 如果不考虑实现 computed（或复用 ReactiveEffect）的情况，完全可以把标记 activeEffect 的功能放到 effect callback 里面。我们只要保证在非惰性调用 effect.run 之前标记 activeEffect 就行，这样依然不影响 effect 的功能。



