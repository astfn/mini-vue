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