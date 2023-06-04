import { ref } from "../../lib/mini-vue.esm.js";

export function useState(defaultValue) {
  const state = ref(defaultValue);
  const setState = (newValue) => (state.value = newValue);
  return [state, setState];
}
