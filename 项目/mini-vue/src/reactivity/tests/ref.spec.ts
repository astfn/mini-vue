import { effect } from "../effect";
import { unRef, isRef, ref, proxyRefs } from "../ref";

describe("ref", () => {
  it("happy path", () => {
    const a = ref(1);
    expect(a.value).toBe(1);
  });

  it("should be reactive", () => {
    const a = ref(1);
    let dummy;
    let calls = 0;

    effect(() => {
      dummy = a.value;
      calls++;
    });

    expect(a.value).toBe(1);
    expect(dummy).toBe(1);
    expect(calls).toBe(1);
    a.value = 2;
    expect(dummy).toBe(2);
    expect(calls).toBe(2);
    //same value should not trigger
    a.value = 2;
    expect(calls).toBe(2);
  });

  it("should make nested properties reactive", () => {
    const raw = { count: 1 };
    const a = ref(raw);
    let dummy;
    let calls = 0;

    effect(() => {
      dummy = a.value.count;
      calls++;
    });

    expect(a.value.count).toBe(1);
    expect(dummy).toBe(1);
    expect(calls).toBe(1);
    a.value.count = 2;
    expect(dummy).toBe(2);
    expect(calls).toBe(2);

    a.value = raw;
    expect(dummy).toBe(2);
    expect(calls).toBe(2);

    a.value = { count: 1 };
    expect(dummy).toBe(1);
    expect(calls).toBe(3);
  });

  it("isRef", () => {
    const raw = { count: 1 };
    const a = ref(raw);
    expect(isRef(a)).toBe(true);
    expect(isRef(raw)).toBe(false);
  });

  it("unRef", () => {
    const raw = 1;
    const a = ref(raw);
    expect(unRef(a) === raw).toBe(true);
    expect(unRef(raw) === raw).toBe(true);
  });

  it("proxyRefs", () => {
    const user = {
      age: ref(18),
      name: "Ashun",
    };
    expect(proxyRefs(user).age).toBe(18);
    expect(proxyRefs(user).name).toBe("Ashun");

    const proxyUser = proxyRefs(user);
    proxyUser.age = 23;
    expect(proxyUser.age).toBe(23);
    expect(user.age.value).toBe(23);

    proxyRefs(user).age = ref(18);
    expect(proxyRefs(user).age).toBe(18);
    expect(user.age.value).toBe(18);

    proxyRefs(user).name = "ashun";
    expect(proxyRefs(user).name).toBe("ashun");
    expect(user.name).toBe("ashun");
  });
});
