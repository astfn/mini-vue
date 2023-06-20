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
        key: props === null || props === void 0 ? void 0 : props.key,
        shapFlag: getShapFlag(type),
        el: undefined,
    };
    //标记 children 类型
    if (typeof children === "string" || typeof children === "number") {
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

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

const extend = Object.assign;
function isObject(target) {
    return target !== null && typeof target === "object";
}
function hasChanged(newValue, oldValue) {
    return !Object.is(newValue, oldValue);
    // newValue===oldValue && !isNaN(newValue) && !isNaN(newValue)
}
function hasOwn(target, key) {
    return Object.prototype.hasOwnProperty.call(target, key);
}

var _ReactiveEffect_fn;
let activeEffect;
let shouldTrack = true;
function isTracking() {
    return activeEffect !== undefined && shouldTrack;
}
function cleanupEffect(effect) {
    var _a;
    (_a = effect.depsMap) === null || _a === void 0 ? void 0 : _a.forEach((dep) => dep.delete(effect));
}
class ReactiveEffect {
    constructor(fn, options) {
        _ReactiveEffect_fn.set(this, void 0);
        this.isCleared = false;
        __classPrivateFieldSet(this, _ReactiveEffect_fn, fn, "f");
        options && extend(this, options);
    }
    run() {
        var _a, _b;
        if (this.isCleared) {
            return (_a = __classPrivateFieldGet(this, _ReactiveEffect_fn, "f")) === null || _a === void 0 ? void 0 : _a.call(this);
        }
        shouldTrack = true;
        activeEffect = this;
        const res = (_b = __classPrivateFieldGet(this, _ReactiveEffect_fn, "f")) === null || _b === void 0 ? void 0 : _b.call(this);
        shouldTrack = false;
        return res;
    }
    stop() {
        if (!this.isCleared) {
            cleanupEffect(this);
            this.onStop && this.onStop();
            this.isCleared = true;
        }
    }
}
_ReactiveEffect_fn = new WeakMap();
function effect(fn, options) {
    let _effect = new ReactiveEffect(fn, options);
    _effect.run();
    activeEffect = undefined;
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
const targetMap = new Map();
function track(target, key) {
    if (!isTracking())
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let deps = depsMap.get(key);
    if (!deps) {
        deps = new Set();
        depsMap.set(key, deps);
    }
    deps.add(activeEffect);
    activeEffect.depsMap = depsMap;
}
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
        if (!isReadonly)
            track(target, propName);
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

var _RefImpl__value, _RefImpl_rawValue;
class RefImpl {
    constructor(value) {
        _RefImpl__value.set(this, void 0);
        _RefImpl_rawValue.set(this, void 0);
        this.__v_isRef = true;
        __classPrivateFieldSet(this, _RefImpl_rawValue, value, "f");
        __classPrivateFieldSet(this, _RefImpl__value, convert(value), "f");
    }
    get value() {
        track(this, "value");
        return __classPrivateFieldGet(this, _RefImpl__value, "f");
    }
    set value(newValue) {
        if (hasChanged(newValue, __classPrivateFieldGet(this, _RefImpl_rawValue, "f"))) {
            __classPrivateFieldSet(this, _RefImpl_rawValue, newValue, "f");
            __classPrivateFieldSet(this, _RefImpl__value, convert(newValue), "f");
            trigger(this, "value");
        }
    }
}
_RefImpl__value = new WeakMap(), _RefImpl_rawValue = new WeakMap();
function convert(newValue) {
    return isObject(newValue) ? reactive(newValue) : newValue;
}
function ref(raw) {
    return new RefImpl(raw);
}
function isRef(value) {
    return !!(value === null || value === void 0 ? void 0 : value.__v_isRef);
}
function unRef(value) {
    return isRef(value) ? value.value : value;
}
function proxyRefs(target) {
    return new Proxy(target, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, newValue) {
            if (isRef(target[key]) && !isRef(newValue)) {
                return Reflect.set(target[key], "value", newValue);
            }
            else {
                return Reflect.set(target, key, newValue);
            }
        },
    });
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
        isMounted: false,
        subTree: null,
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
        instance.setupState = proxyRefs(setupResult);
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
    const { createElement: hostCreateElement, patchProps: hostPatchProps, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container, parentComponent) {
        //调用 patch 对虚拟节点进行具体处理
        console.log("render", vnode, container, parentComponent);
        patch(null, vnode, container, parentComponent);
    }
    /**
     * n1: old vnode tree
     * n2: new vnode tree
     */
    function patch(n1, n2, container, parentComponent) {
        const { type, shapFlag } = n2;
        switch (type) {
            case Fragment: {
                procescsFragment(n1, n2, container, parentComponent);
                break;
            }
            case Text: {
                procescsText(n1, n2, container);
                break;
            }
            default: {
                // 根据 vnode 的类型，来决定是处理 component 还是 element
                if (shapFlag & ShapFlags.ELEMENT) {
                    procescsElement(n1, n2, container, parentComponent);
                }
                else if (shapFlag & ShapFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container, parentComponent);
                }
            }
        }
    }
    function procescsText(n1, n2, container) {
        const el = (n2.el = document.createTextNode(n2.children));
        container.appendChild(el);
    }
    function procescsFragment(n1, n2, container, parentComponent) {
        mountChildren(n2.children, container, parentComponent);
    }
    function procescsElement(n1, n2, container, parentComponent) {
        /**
         * 主要逻辑有：挂载、更新
         */
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            patchElement(n1, n2, container, parentComponent);
        }
    }
    function mountElement(vnode, container, parentComponent) {
        // const el = (vnode.el = document.createElement(vnode.type));
        const el = (vnode.el = hostCreateElement(vnode.type));
        const { children, props, shapFlag } = vnode;
        //props
        Object.entries(props).forEach(([key, value]) => {
            hostPatchProps(el, key, null, value);
        });
        //children
        if (shapFlag & ShapFlags.TEXT_CHILDREN) {
            el.innerText = children;
        }
        else if (shapFlag & ShapFlags.ARRAY_CHILDREN) {
            mountChildren(vnode.children, el, parentComponent);
        }
        hostInsert(el, container);
    }
    function patchElement(n1, n2, container, parentComponent) {
        console.log("patchElement");
        console.log("current tree", n2);
        console.log("prev tree", n1);
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, container, parentComponent);
        const oldProps = n1.props;
        const newProps = n2.props;
        patchProps(el, oldProps, newProps);
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            hostRemove(el);
        }
    }
    function patchChildren(n1, n2, container, parentComponent) {
        const { shapFlag: prevShapFlag, children: c1 } = n1;
        const { shapFlag, children: c2 } = n2;
        if (shapFlag & ShapFlags.TEXT_CHILDREN) {
            if (prevShapFlag & ShapFlags.ARRAY_CHILDREN) {
                unmountChildren(c1);
                hostSetElementText(n2.el, c2);
            }
            c1 !== c2 && hostSetElementText(n2.el, c2);
        }
        else {
            if (prevShapFlag & ShapFlags.TEXT_CHILDREN) {
                hostSetElementText(n2.el, "");
                mountChildren(c2, n2.el, parentComponent);
            }
            else {
                /**
                 * 无脑实现版本，后续需要经典的双端对比算法来打补丁
                 */
                // unmountChildren(c1);
                // mountChildren(c2, n2.el, parentComponent);
                patchKeyedChildren(c1, c2, n2.el, parentComponent);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent) {
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = c2.length - 1;
        function isSomeVNodeType(n1, n2) {
            return n1.type == n2.type && n1.key == n2.key;
        }
        //自左向右对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent);
                i++;
            }
            else {
                break;
            }
        }
        //自右向左对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent);
                e1--;
                e2--;
            }
            else {
                break;
            }
        }
        //恰好右半部分是处理区间--只需新增节点
        if (i > e1) {
            while (e2 >= i) {
                const n2 = c2[e2];
                patch(null, n2, container, parentComponent);
                e2--;
            }
        }
    }
    function patchProps(el, oldProps, newProps) {
        /**
         * 以 newProps 为基础, 检索 oldProps, 处理以下 case
         * 1. newProps 与 oldProps 都存在某个 key, 且值不一样 (进行 patch)
         * 2. newProps 中存在某个 key, 但 oldProps 中不存在 (进行 add)
         */
        Object.entries(newProps).forEach(([key, nextProp]) => {
            const prevProp = oldProps[key];
            if (prevProp !== nextProp)
                hostPatchProps(el, key, prevProp, nextProp);
        });
        /**
         * 以 oldProps 为基础, 检索 newProps, 处理以下 case
         * 1. oldProps 中的某个 key, 在 newProps 中不存在了 (delete)
         */
        Object.entries(oldProps).forEach(([key, prevProp]) => {
            if (!(key in newProps))
                hostPatchProps(el, key, prevProp, null);
        });
    }
    function mountChildren(children, container, parentComponent) {
        for (const v of children) {
            patch(null, v, container, parentComponent);
        }
    }
    function processComponent(n1, n2, container, parentComponent) {
        /**
         * 主要逻辑有：挂载组件、更新组件
         */
        //初始化流程，目前只关注挂载组件过程
        mountComponent(n2, container, parentComponent);
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
        effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy, h));
                patch(null, subTree, container, parentComponent);
                initialVnode.el = subTree.el;
                console.log("init", subTree);
                instance.isMounted = true;
            }
            else {
                const { proxy } = instance;
                const subTree = instance.render.call(proxy, h);
                const prevSubTree = instance.subTree;
                patch(prevSubTree, subTree, container, parentComponent);
                instance.subTree = subTree;
            }
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProps(el, key, prevProp, nextProp) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLocaleLowerCase();
        el.addEventListener(event, nextProp);
    }
    else {
        if (nextProp === undefined || nextProp === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextProp);
        }
    }
}
function insert(el, container) {
    container.appendChild(el);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProps,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createRenderer, createTextVNode, effect, getCurrentInstance, inject, provide, proxyRefs, ref, renderSlots };
