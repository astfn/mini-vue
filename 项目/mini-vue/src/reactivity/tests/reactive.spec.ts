import { reactive } from "../reactive";

describe("reactive", () => {
  it("happy path", () => {
    const rawObj = { name: "Ashun" };
    const observe = reactive(rawObj);

    expect(rawObj !== observe).toBe(true);
    expect(observe.name).toBe("Ashun");
  });
});
