function createGetter(target: Object, propName: string | symbol) {
  //TODO: track
  return Reflect.get(target, propName);
}

function createSetter(target: Object, propName: string | symbol, newValue) {
  const res = Reflect.set(target, propName, newValue);
  //TODO: trigger
  return res;
}

export function reactive(raw) {
  return new Proxy(raw, {
    get: createGetter,
    set: createSetter,
  });
}
