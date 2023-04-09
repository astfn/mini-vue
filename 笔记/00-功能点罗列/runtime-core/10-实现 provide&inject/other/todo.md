***基础思路：***

​	provide & inject，实际上就是存数据和取数据的过程。因此，每个组件实例中都存储一个 provides，用于保存暴露给子树组件的 state，当子树中的组件调用 inject 方法时，只需要通过攀爬组件树，来找到与 key 相匹配的共享 state 即可。

​	由于需要不断访问父级组件，因此还需要在组件实例中保存父级组件实例。



***todo***

1. 实现父子传递
   * inject 时，暂时只需要从父级组件的 provides 中匹配 key 即可。
2. 实现跨层级传递
   * 把各组件的 provides 初始化为父级组件的 provides，这样 provides 就不断继承了下去
     * 组件本身既 provide 了一个 key，又同时 inject 了这个 key。并且祖先组件也 provide 了这个 key。此时就会引发：当前组件 inject 的内容是自己 provide 的内容。
     * 解决：巧用 js 原型链特性
       * 根据 inject 的使用特性，发现其访问 provides 中某个 key 的逻辑与 js 原型链特性一致
         * 先访问组件自身的 provides 中有没有这个 key，如果没有，则不断向父级攀爬进行访问，直到根组件
         * 当向自身的 provides 压入新的 key 时，不会影响父级组件的 provides。
       * 因此，我们只需在初始化组件自身的 provides 时利用 Object.create 方法创建一个纯字典，并指定其父级原型对象为父组件的 provides 即可。