import { isReactive, reactive } from "../reactive";

describe("reactive", () => {
  it("happy path", () => {
    const rawObj = { name: "Ashun" };
    const observe = reactive(rawObj);

    expect(rawObj !== observe).toBe(true);
    expect(observe.name).toBe("Ashun");
    expect(isReactive(observe)).toBe(true);
    expect(isReactive(rawObj)).toBe(false);
  });

  it("nested reactive", () => {
    const raw = {
      nested: { foo: 1 },
      array: [{ name: "Ashun", hobbies: ["coding", "music"] }],
    };
    const wrapped = reactive(raw);
    expect(isReactive(raw)).toBe(false);
    expect(isReactive(wrapped)).toBe(true);
    expect(isReactive(wrapped.nested)).toBe(true);
    expect(isReactive(wrapped.array)).toBe(true);
    expect(isReactive(wrapped.array[0])).toBe(true);
    expect(isReactive(wrapped.array[0].hobbies)).toBe(true);
    expect(isReactive(wrapped.array[0].name)).toBe(false);
    expect(isReactive(wrapped.nested.foo)).toBe(false);
  });
});
