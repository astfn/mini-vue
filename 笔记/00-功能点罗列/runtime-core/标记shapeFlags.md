### who?

​	前面我们已经实现了 runtime-core 的初始化基础流程，其中我们根据 `vnode.type` 是否为对象来判断 vode 是 component 还是 element；以及判断 `vnode.children` 属于纯文本类型，还是数组。然后根据这些类型判断，走不同的处理逻辑。

​	但这些判断逻辑分散在各处，不利于后期维护，以及阅读。我们希望给 vnode 一个标识，用于体现 vnode 自身的类型（包括它的children）。

​	这个标记就是 `shapeFlags`。

### 尝试实现

使用字典进行存储，各个类型使用 0 或 1 标识是否具有该类型特征

```
const shapFlags = {
  element: 0,
  stateful_component: 0,
  text_children: 0,
  array_children: 0,
};
```

**支持修改**

* *标记某个 vnode 为具有状态的组件类型*

```
shapFlags.stateful_component = 1;
```

* *标记某个 vnode 为 element 类型，并且 children 是数组类型*

```
shapFlags.element = 1;
shapFlags.array_children = 1;
```

**支持查找**

* *判断某个 vnode 是否为 element 类型*

```
if(shapFlags.element)
```

* *判断某个 vnode 是否为具有状态的组件类型，并且 children 是数组类型*

```
if(shapFlags.stateful_component && shapFlags.array_children)
```

>但这种方式其实性能并不高，我们可以利用计算机的位运算，高效读写。
>
>当然了，这种方式也有优点，就是可读性相对好一些

### 位运算高效实现

利用四位二进制，标识各种类型。

```
0000 -> 初始化值
0001 -> element
0010 -> stateful_component 
0100 -> text_children
1000 -> array_children
```

```
export enum ShapFlags {
  ELEMENT = 1,
  STATEFUL_COMPONENT = 1 << 1,
  TEXT_CHILDREN = 1 << 2,
  ARRAY_CHILDREN = 1 << 3,
}
```

支持修改（利用 **或运算**）`currentType = currentType | targetType`

* *将 vnode 标记为 element 类型*

```
0000 | 0001 === 0001
```

* *在设置其 children 为 text 类型*

```
0001 | 0100 === 0101
```

支持读取（利用 **与运算**） `currentType & targetType`

* 判断上述 vnode 自身类型

```
if(0101 & 0001) // true 0001
if(0110 & 0001) // false 计算结果为0000
```

* 判断上述 vnode 的 children 类型

```
if(0101 & 0100) // true
if(1001 & 0100) // false 计算结果为0000
```

