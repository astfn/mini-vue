### reactive

#### reactive

* getter
  * track
* setter
  * trigger

#### readonly

* getter（不需要track）
* setter（不需要真实地进行Reflect.set，在return之前抛出警告）
* 实现 readonly 后，可以将 reactive 与 readonly 的代码进行重构，将公共部分抽离

### effecct

* 非惰性调用 fn，触发 reactive 的 getter
*  利用 Map<Objcte,Map<string|symbol，ReactiveEffect>> 缓存所有副作用函数
* effect 需返回 runner
* 支持 scheduler
* stop 函数；onStop option