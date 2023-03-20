'use strict';

function isObject(target) {
    return target !== null && typeof target === "object";
}
function hasOwn(target, key) {
    return Object.prototype.hasOwnProperty.call(target, key);
}

var ShapFlags;
(function (ShapFlags) {
    ShapFlags[ShapFlags["ELEMENT"] = 1] = "ELEMENT";
    ShapFlags[ShapFlags["STATEFUL_COMPONENT"] = 2] = "STATEFUL_COMPONENT";
    ShapFlags[ShapFlags["TEXT_CHILDREN"] = 4] = "TEXT_CHILDREN";
    ShapFlags[ShapFlags["ARRAY_CHILDREN"] = 8] = "ARRAY_CHILDREN";
})(ShapFlags || (ShapFlags = {}));

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapFlag: getShapFlag(type),
        el: undefined,
    };
    //标记 children 类型
    if (typeof children === "string")
        vnode.shapFlag |= ShapFlags.TEXT_CHILDREN;
    if (Array.isArray(children))
        vnode.shapFlag |= ShapFlags.ARRAY_CHILDREN;
    return vnode;
}
function getShapFlag(type) {
    return typeof type === "string"
        ? ShapFlags.ELEMENT
        : ShapFlags.STATEFUL_COMPONENT;
}

const targetMap = new Map();
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let deps = depsMap === null || depsMap === void 0 ? void 0 : depsMap.get(key);
    deps === null || deps === void 0 ? void 0 : deps.forEach((effect) => {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    });
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function (target, propName) {
        if (propName === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
        }
        if (propName === ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }
        const res = Reflect.get(target, propName);
        if (shallow) {
            return res;
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function (target, propName, newValue) {
        const res = Reflect.set(target, propName, newValue);
        trigger(target, propName);
        return res;
    };
}
const mutableHandler = {
    get,
    set,
};
const readonlyHandler = {
    get: readonlyGet,
    set(_target, propName, _newValue) {
        console.warn(`key:${String(propName)} set 失败,因为target 是 readonly`);
        return true;
    },
};
const shallowReadonlyHandler = {
    get: shallowReadonlyGet,
    set: readonlyHandler.set,
};

var ReactiveFlags;
(function (ReactiveFlags) {
    ReactiveFlags["IS_REACTIVE"] = "__v_isReactive";
    ReactiveFlags["IS_READONLY"] = "__v_isReadonly";
})(ReactiveFlags || (ReactiveFlags = {}));
function createActiveObject(target, baseHandler) {
    if (!isObject(target)) {
        console.error(`target: ${target} 必须是一个对象`);
        return target;
    }
    return new Proxy(target, baseHandler);
}
function reactive(raw) {
    return createActiveObject(raw, mutableHandler);
}
function readonly(raw) {
    return createActiveObject(raw, readonlyHandler);
}
function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandler);
}

function emit(instance, event, ...args) {
    const { props } = instance;
    const camelize = (str) => {
        return str.replace(/-(\w)/g, (_matchRes, matchGroup) => {
            return matchGroup ? matchGroup.toUpperCase() : "";
        });
    };
    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
    const toHandlerKey = (str) => {
        return str ? "on" + capitalize(str) : "";
    };
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps !== null && rawProps !== void 0 ? rawProps : {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key))
            return setupState[key];
        if (hasOwn(props, key))
            return props[key];
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter)
            return publicGetter(instance);
    },
};

function createComponentInstance(vnode) {
    const defaultEmit = () => { };
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
function setupComponent(instance) {
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
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function render(vnode, container) {
    //调用 patch 对虚拟节点进行具体处理
    patch(vnode, container);
}
function patch(vnode, container) {
    const { shapFlag } = vnode;
    // 根据 vnode 的类型，来决定是处理 component 还是 element
    if (shapFlag & ShapFlags.ELEMENT) {
        procescsElement(vnode, container);
    }
    else if (shapFlag & ShapFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container);
    }
}
function procescsElement(vnode, container) {
    /**
     * 主要逻辑有：挂载、更新
     */
    //初始化流程，目前只关注挂载过程
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const el = (vnode.el = document.createElement(vnode.type));
    const { children, props, shapFlag } = vnode;
    //props
    const isOn = (key) => /^on[A-Z]/.test(key);
    Object.entries(props).forEach(([key, value]) => {
        if (isOn(key)) {
            const event = key.slice(2).toLocaleLowerCase();
            el.addEventListener(event, value);
        }
        else {
            el.setAttribute(key, value);
        }
    });
    //children
    if (shapFlag & ShapFlags.TEXT_CHILDREN) {
        el.innerText = children;
    }
    else if (shapFlag & ShapFlags.ARRAY_CHILDREN) {
        mountChildren(vnode, el);
    }
    container.appendChild(el);
}
function mountChildren(vnode, container) {
    for (const vnodeItem of vnode.children) {
        patch(vnodeItem, container);
    }
}
function processComponent(vnode, container) {
    /**
     * 主要逻辑有：挂载组件、更新组件
     */
    //初始化流程，目前只关注挂载组件过程
    mountComponent(vnode, container);
}
function mountComponent(initialVnode, container) {
    /**
     * 创建组件实例
     * 对组件实例进行初始化设置
     */
    const instance = createComponentInstance(initialVnode);
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container);
}
function setupRenderEffect(instance, initialVnode, container) {
    const subTree = instance.render.call(instance.proxy, h);
    patch(subTree, container);
    initialVnode.el = subTree.el;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            //1. 先将组件统一转化为 vnode，后续都会基于 vnode 进行各种操作
            //2. 创建组件实例，并 render
            const vnode = createVNode(rootComponent);
            const targetRootContainer = getRootContainer(rootContainer);
            render(vnode, targetRootContainer);
        },
    };
}
function getRootContainer(rootContainer) {
    if (typeof rootContainer === "string") {
        return document.querySelector(rootContainer);
    }
    else if (isObject(rootContainer)) {
        return rootContainer;
    }
}

exports.createApp = createApp;
