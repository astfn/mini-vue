##### **稳定序列（概念）**

这里的稳定，是位置关系上的稳定。

例如 ：

* `oldChildren: [C,D,E]` 、`newChildren: [E,C,D]`
* `oldChildren: [C,D,E]` 、`newChildren: [C,E,D]`
* 其中 `C,D`  的相对位置都没有改变
  * C 依旧在 D 的左侧
  * D 也依旧在 C 的右侧
* 而在数组中，标记位置关系的就是下标 index
  * C 比 D 的 index 小，它就在 D 的左侧
  * 同理， D 比 C 的 index 大，它就在 C 的右侧
* 所以只要在新旧 children 中，某些节点的 index 大小关系不变，就意味着它们之间的相对位置没有改变

---

##### **寻找最长递增子序列（算法）**

……

---

##### **功能实现**

* 在稳定序列中，则不用处理，反之移动（insert）

---

##### **功能实现后，回顾设计巧妙点**

1. newIndexToOldIndexMap 设计为长度固定为 newChildren 的Array

   >newIndexToOldIndexMap 中的 index 就是 newChildNode 在 newChildren 中的位置，而对应的 value 就是 newChild 在 oldChildren 中分身的位置 + 1。（这里的分身是指：在 newChildren 和 oldChildren 中都存在的节点）
   >
   >* 一开始 value 统一初始化为 0 
   >* 在给 newIndexToOldIndexMap 赋值时，要判断当前遍历到的节点是不是也存在于 oldChildren 中。
   >  * 若存在，则赋值为 oldChild index + 1
   >  * 不存在则不进行任何操作，保留默认值 0 
   >
   >之所以赋值为 oldChild index + 1 是为了防止 oldChild index 为 0 ，与默认值 0 重复的情况。
   >
   >而默认值 0 就是标记那些在 newChildren 中存在，却不存在于 oldChildren 中的节点。也就是那些需要新增的节点。 

   * 更好的与 `寻找最长递增子序列` 算法适配
     * 该算法有个最简易的 demo，就是传入一个数组，寻找这个数组中的最长递增子序列，并返回对应的 index
     * 而将 newIndexToOldIndexMap 直接设计成数组，就能够直接兼容这个算法的最简易版本，不用再对算法进行特殊改造了。
   * 性能也会更好，具体参考 [JS中设置数组长度的意义是什么](https://blog.csdn.net/Mrcxt/article/details/52155226)