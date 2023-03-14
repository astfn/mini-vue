export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    render: undefined,
    proxy: undefined,
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
  instance.proxy = new Proxy(
    {},
    {
      get(_target, key) {
        const { setupState, vnode } = instance;
        if (key in setupState) return setupState[key];
        if (key === "$el") return vnode.el;
      },
    }
  );

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
