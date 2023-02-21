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

  it("nested readonly", () => {
    const raw = {
      nested: { foo: 1 },
      array: [{ name: "Ashun", hobbies: ["coding", "music"] }],
    };
    const wrapped = readonly(raw);
    expect(isReadonly(raw)).toBe(false);
    expect(isReadonly(wrapped)).toBe(true);
    expect(isReadonly(wrapped.nested)).toBe(true);
    expect(isReadonly(wrapped.array)).toBe(true);
    expect(isReadonly(wrapped.array[0])).toBe(true);
    expect(isReadonly(wrapped.array[0].hobbies)).toBe(true);
    expect(isReadonly(wrapped.array[0].name)).toBe(false);
    expect(isReadonly(wrapped.nested.foo)).toBe(false);
  });
});
