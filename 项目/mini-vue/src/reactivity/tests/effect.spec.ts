import { effect } from "../effect";
import { reactive } from "../reactive";

describe("effect", () => {
  it("happy path", () => {
    const userInfo = reactive({ name: "Ashun", age: 20 });

    let currentAge = 0;
    effect(() => {
      currentAge = userInfo.age + 1;
    });

    expect(currentAge).toBe(21);

    //update
    userInfo.age++;
    expect(currentAge).toBe(22);
    userInfo.age++;
    expect(currentAge).toBe(23);
  });

  it("should return runner when call effect", () => {
    let foo = 0;
    const fn = effect(() => {
      return ++foo;
    });

    expect(foo).toBe(1);
    expect(fn()).toBe(2);
  });
});
