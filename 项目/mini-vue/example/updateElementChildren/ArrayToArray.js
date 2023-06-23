import { useState } from "./hooks.js";

/**
 * 一、特殊 case 拆分
 */
/**
 * 1.自左向右对比，找到不同处，指针停止移动。
 *   此时右半部分恰好就是要处理的区间
 *   并且只需新增或删除节点
 */
////1.1 new children 比 old children 长 (新增节点)
// const oldArray = ["A", "B"];
// const newArray = ["A", "B", "D", "E"];

//// 1.2 new children 比 old children 短 (删除节点)
// const oldArray = ["A", "B", "D", "E"];
// const newArray = ["A", "B"];

/**
 * 2.自右向左对比，找到不同处，指针停止移动。
 *   此时左半部分恰好就是要处理的区间
 *   并且只需新增或删除节点
 */
////2.1 new children 比 old children 长 (新增节点)
// const oldArray = ["B", "C"];
// const newArray = ["D", "E", "B", "C"];

//// 2.2 new children 比 old children 短 (删除节点)
// const oldArray = ["D", "E", "B", "C"];
// const newArray = ["B", "C"];

/**
 * 二、普通 case 拆分
 */
//// 1. 删除节点
// const oldArray = ["A", "B", "E", "M", "L", "H", "C", "D"];
// const newArray = ["A", "B", "M", "E", "C", "D"];
//// 1.1 删除节点-特殊 case 性能优化（在收缩区间内：newChildren 中的所有元素，也都存在于 oldChildren 中）
const oldArray = ["A", "B", "E", "M", "L", "H", "C", "D"];
const newArray = ["A", "B", "M", "E", "C", "D"];

export default {
  setup() {
    const [convert, setConvert] = useState(false);
    window.setConvert = setConvert;
    return {
      convert,
      setConvert,
    };
  },
  render(h) {
    const targetChildren = (this.convert ? newArray : oldArray).map((item) =>
      h("li", { key: item }, item)
    );
    return h("div", {}, [
      h("button", { onClick: () => this.setConvert(true) }, "ArrayToArray"),
      h("ul", {}, targetChildren),
    ]);
  },
};
