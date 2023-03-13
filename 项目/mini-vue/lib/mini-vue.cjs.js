'use strict';

function isObject(target) {
    return target !== null && typeof target === "object";
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
    };
    debugger;
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

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupResult: undefined,
        render: undefined,
    };
    return component;
}
function setupComponent(instance) {
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
    const el = document.createElement(vnode.type);
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
function mountComponent(vnode, container) {
    /**
     * 创建组件实例
     * 对组件实例进行初始化设置
     */
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, container);
}
function setupRenderEffect(instance, container) {
    const subTree = instance.render(h);
    patch(subTree, container);
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
