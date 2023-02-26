import { isProxy, isReadonly, shallowReadonly } from "../reactive";

describe("shallowReadonly", () => {
  it("happy path", () => {
    const raw = { nested: { foo: 1 } };
    const wrapped = shallowReadonly(raw);
    expect(isReadonly(raw)).toBe(false);
    expect(isReadonly(wrapped)).toBe(true);
    expect(isReadonly(wrapped.nested)).toBe(false);
    expect(isProxy(wrapped)).toBe(true);
    expect(isProxy(raw)).toBe(false);
  });
});
