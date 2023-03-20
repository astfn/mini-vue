import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";

export function createComponentInstance(vnode) {
  const defaultEmit: Function = () => {};
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    render: undefined,
    proxy: undefined,
    emit: defaultEmit,
  };
  component.emit = emit.bind(null, component);
  return component;
}

export function setupComponent(instance) {
  initProps(instance, instance.vnode.props);
  /**
   * TODO
   * initSlots
   */
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
  const Component = instance.type;
  const { setup } = Component;
  if (setup) {
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    });
    handleSetupResult(instance, setupResult);
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
