import { effect, stop } from "../effect";
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

  it("scheduler", () => {
    let dummy;
    var run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    var runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    // should be called on first trigger
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    // should not run yet
    expect(dummy).toBe(1);
    // manually run
    run();
    // should have run
    expect(dummy).toBe(2);
  });

  it("stop", () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(2);
    stop(runner);
    // obj.prop = 3;
    obj.prop++;
    expect(dummy).toBe(2);

    // stopped effect should still be manually callable
    runner();
    expect(dummy).toBe(3);
  });

  it("events: onStop", () => {
    const onStop = jest.fn();
    const runner = effect(() => {}, {
      onStop,
    });

    stop(runner);
    expect(onStop).toHaveBeenCalled();
  });
});
