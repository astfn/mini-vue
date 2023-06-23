性能优化点：

1. 利用 Map 存储 key -> vnode，用空间换时间
2. 特殊 case 的性能优化：newChildren 中的所有元素都存在于 oldChildren 中
   * 记录 patch 的次数，如果已经达到了 newChildren.length 且 oldChildren 中还有其它节点没遍历完。
   * 那么 oldChildren 中剩下没遍历的节点直接移除即可。