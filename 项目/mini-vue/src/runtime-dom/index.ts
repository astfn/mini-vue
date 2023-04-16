import { createRenderer } from "../runtime-core";

function createElement(type) {
  return document.createElement(type);
}

function patchProps(el, key, value) {
  const isOn = (key: string) => /^on[A-Z]/.test(key);
  if (isOn(key)) {
    const event = key.slice(2).toLocaleLowerCase();
    el.addEventListener(event, value);
  } else {
    el.setAttribute(key, value);
  }
}

function insert(el, container) {
  container.appendChild(el);
}

const renderer: any = createRenderer({
  createElement,
  patchProps,
  insert,
});

export function createApp(...args) {
  return renderer.createApp(...args);
}

export * from "../runtime-core";
