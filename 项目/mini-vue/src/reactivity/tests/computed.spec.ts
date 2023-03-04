import { reactive } from "../reactive";
import { computed } from "../computed";

describe("computed", () => {
  it("happy path", () => {
    const user = reactive({
      name: "Ashun",
      age: 18,
    });

    const computedCallback = jest.fn(() => user.age);
    const computedAge = computed(computedCallback);

    //lazy
    expect(computedCallback).not.toHaveBeenCalled();

    expect(computedAge.value).toBe(18);
    expect(computedCallback).toHaveBeenCalledTimes(1);

    //user.age 并未改变，不需要再次计算
    expect(computedCallback).toHaveBeenCalledTimes(1);

    //user.age 改变，但未访问 computedAge.value，也不需要再次计算
    user.age++;
    expect(computedCallback).toHaveBeenCalledTimes(1);

    //now it should compute
    expect(computedAge.value).toBe(19);
    expect(computedCallback).toHaveBeenCalledTimes(2);

    computedAge.value;
    expect(computedCallback).toHaveBeenCalledTimes(2);
  });
});
