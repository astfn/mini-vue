export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupResult: undefined,
    render: undefined,
  };
  return component;
}

export function setupComponent(instance) {
  /**
   * TODO
   * 1. initProps
   * 2. initSlots
   */
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  const Component = instance.type;
  const { setup } = Component;
  if (setup) {
    const setupResult = setup();
    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance, setupResult) {
  /**
   * TODO
   * function type result
   */
  if (typeof setupResult === "object") {
    instance.setupResult = setupResult;
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;
  if (Component.render) {
    instance.render = Component.render;
  }
}
