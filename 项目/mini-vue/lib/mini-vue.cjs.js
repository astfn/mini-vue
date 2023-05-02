'use strict';

var ShapFlags;
(function (ShapFlags) {
    ShapFlags[ShapFlags["ELEMENT"] = 1] = "ELEMENT";
    ShapFlags[ShapFlags["STATEFUL_COMPONENT"] = 2] = "STATEFUL_COMPONENT";
    ShapFlags[ShapFlags["TEXT_CHILDREN"] = 4] = "TEXT_CHILDREN";
    ShapFlags[ShapFlags["ARRAY_CHILDREN"] = 8] = "ARRAY_CHILDREN";
    ShapFlags[ShapFlags["SLOTS_CHILDREN"] = 16] = "SLOTS_CHILDREN";
})(ShapFlags || (ShapFlags = {}));

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapFlag: getShapFlag(type),
        el: undefined,
    };
    //标记 children 类型
    if (typeof children === "string") {
        vnode.shapFlag |= ShapFlags.TEXT_CHILDREN;
    }
    else if (Array.isArray(children))
        vnode.shapFlag |= ShapFlags.ARRAY_CHILDREN;
    else if (typeof children === "object")
        vnode.shapFlag |= ShapFlags.SLOTS_CHILDREN;
    return vnode;
}
function getShapFlag(type) {
    return typeof type === "string"
        ? ShapFlags.ELEMENT
        : ShapFlags.STATEFUL_COMPONENT;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function")
            return createVNode(Fragment, {}, slot(props));
    }
}

function isObject(target) {
    return target !== null && typeof target === "object";
}
function hasOwn(target, key) {
    return Object.prototype.hasOwnProperty.call(target, key);
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
    $slots: (i) => i.slots,
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

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapFlag & ShapFlags.SLOTS_CHILDREN) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    const defaultEmit = () => { };
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        render: undefined,
        proxy: undefined,
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        emit: defaultEmit,
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
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
    }
    else {
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
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}
let currentInstance = null;
function setCurrentInstance(instance) {
    currentInstance = instance;
}
function getCurrentInstance() {
    return currentInstance;
}

function provide(key, value) {
    var _a;
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = (_a = currentInstance.parent) === null || _a === void 0 ? void 0 : _a.provides;
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === "function")
                return defaultValue();
            return defaultValue;
        }
    }
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                //1. 先将组件统一转化为 vnode，后续都会基于 vnode 进行各种操作
                //2. 创建组件实例，并 render
                const vnode = createVNode(rootComponent);
                const targetRootContainer = getRootContainer(rootContainer);
                render(vnode, targetRootContainer, null);
            },
        };
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

function h(type, props, children) {
    return createVNode(type, props, children);
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProps: hostPatchProps, insert: hostInsert, } = options;
    function render(vnode, container, parentComponent) {
        //调用 patch 对虚拟节点进行具体处理
        patch(vnode, container, parentComponent);
    }
    function patch(vnode, container, parentComponent) {
        const { type, shapFlag } = vnode;
        switch (type) {
            case Fragment: {
                procescsFragment(vnode, container, parentComponent);
                break;
            }
            case Text: {
                procescsText(vnode, container);
                break;
            }
            default: {
                // 根据 vnode 的类型，来决定是处理 component 还是 element
                if (shapFlag & ShapFlags.ELEMENT) {
                    procescsElement(vnode, container, parentComponent);
                }
                else if (shapFlag & ShapFlags.STATEFUL_COMPONENT) {
                    processComponent(vnode, container, parentComponent);
                }
            }
        }
    }
    function procescsText(vnode, container) {
        const el = (vnode.el = document.createTextNode(vnode.children));
        container.appendChild(el);
    }
    function procescsFragment(vnode, container, parentComponent) {
        mountChildren(vnode, container, parentComponent);
    }
    function procescsElement(vnode, container, parentComponent) {
        /**
         * 主要逻辑有：挂载、更新
         */
        //初始化流程，目前只关注挂载过程
        mountElement(vnode, container, parentComponent);
    }
    function mountElement(vnode, container, parentComponent) {
        // const el = (vnode.el = document.createElement(vnode.type));
        const el = (vnode.el = hostCreateElement(vnode.type));
        const { children, props, shapFlag } = vnode;
        //props
        Object.entries(props).forEach(([key, value]) => {
            // if (isOn(key)) {
            //   const event = key.slice(2).toLocaleLowerCase();
            //   el.addEventListener(event, value);
            // } else {
            //   el.setAttribute(key, value);
            // }
            hostPatchProps(el, key, value);
        });
        //children
        if (shapFlag & ShapFlags.TEXT_CHILDREN) {
            el.innerText = children;
        }
        else if (shapFlag & ShapFlags.ARRAY_CHILDREN) {
            mountChildren(vnode, el, parentComponent);
        }
        // container.appendChild(el);
        hostInsert(el, container);
    }
    function mountChildren(vnode, container, parentComponent) {
        for (const vnodeItem of vnode.children) {
            patch(vnodeItem, container, parentComponent);
        }
    }
    function processComponent(vnode, container, parentComponent) {
        /**
         * 主要逻辑有：挂载组件、更新组件
         */
        //初始化流程，目前只关注挂载组件过程
        mountComponent(vnode, container, parentComponent);
    }
    function mountComponent(initialVnode, container, parentComponent) {
        /**
         * 创建组件实例
         * 对组件实例进行初始化设置
         */
        const instance = createComponentInstance(initialVnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container, instance);
    }
    function setupRenderEffect(instance, initialVnode, container, parentComponent) {
        const subTree = instance.render.call(instance.proxy, h);
        patch(subTree, container, parentComponent);
        initialVnode.el = subTree.el;
    }
    return {
        createApp: createAppAPI(render),
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProps(el, key, value) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLocaleLowerCase();
        el.addEventListener(event, value);
    }
    else {
        el.setAttribute(key, value);
    }
}
function insert(el, container) {
    container.appendChild(el);
}
const renderer = createRenderer({
    createElement,
    patchProps,
    insert,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.inject = inject;
exports.provide = provide;
exports.renderSlots = renderSlots;
