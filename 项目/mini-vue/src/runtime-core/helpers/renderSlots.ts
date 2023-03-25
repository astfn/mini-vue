import { createVNode } from "../createVNode";

export function renderSlots(slots, name) {
  const slot = slots[name];
  if (slot) {
    return createVNode("div", {}, slot);
  }
}
