import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";

export function createComponentInstance(vnode) {
  const defaultEmit: Function = () => {};
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    render: undefined,
    proxy: undefined,
    props: {},
    slots: {},
    emit: defaultEmit,
  };
  component.emit = emit.bind(null, component);
  return component;
}

export function setupComponent(instance) {
  initProps(instance, instance.vnode.props);
  initSlots(instance, instance.vnode.children);
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
  const Component = instance.type;
  const { setup } = Component;
  if (setup) {
    setCurrentInstance(instance);
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    });
    setCurrentInstance(null);
    handleSetupResult(instance, setupResult);
  } else {
    finishComponentSetup(instance);
  }
}

function handleSetupResult(instance, setupResult) {
  /**
   * TODO
   * function type result
   */
  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;
  if (Component.render) {
    instance.render = Component.render;
  }
}

let currentInstance = null;

function setCurrentInstance(instance) {
  currentInstance = instance;
}

export function getCurrentInstance() {
  return currentInstance;
}
