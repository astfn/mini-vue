'use strict';

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
    };
    return vnode;
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
    patch(vnode);
}
function patch(vnode, container) {
    // 根据 vnode 的类型，来决定是处理 component 还是 element
    // 目前先实现 processComponent 用于处理 component
    processComponent(vnode);
}
function processComponent(vnode, container) {
    /**
     * 主要逻辑有：挂载组件、更新组件
     */
    //初始化流程，目前只关注挂载组件过程
    mountComponent(vnode);
}
function mountComponent(vnode, container) {
    /**
     * 创建组件实例
     * 对组件实例进行初始化设置
     */
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance);
}
function setupRenderEffect(instance, container) {
    const subTree = instance.render(h);
    patch(subTree);
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            //1. 先将组件统一转化为 vnode，后续都会基于 vnode 进行各种操作
            //2. 创建组件实例，并 render
            const vnode = createVNode(rootComponent);
            render(vnode);
        },
    };
}

exports.createApp = createApp;
