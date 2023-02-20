import { isReadonly, readonly } from "../reactive";

describe("readonly", () => {
  it("happy path", () => {
    const original = { foo: 0 };
    const wrapped = readonly(original);
    expect(original !== wrapped).toBe(true);
    wrapped.foo++;
    expect(wrapped.foo).toBe(0);
    expect(isReadonly(wrapped)).toBe(true);
    expect(isReadonly(original)).toBe(false);
  });

  it("warn then call set", () => {
    console.warn = jest.fn();
    const wrapped = readonly({ foo: 0 });
    wrapped.foo++;
    expect(console.warn).toBeCalled();
  });
});
