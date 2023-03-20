export function emit(instance, event, ...args) {
  const { props } = instance;

  const camelize = (str: string) => {
    return str.replace(/-(\w)/g, (_matchRes, matchGroup) => {
      return matchGroup ? matchGroup.toUpperCase() : "";
    });
  };

  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  const toHandlerKey = (str: string) => {
    return str ? "on" + capitalize(str) : "";
  };
  const handlerName = toHandlerKey(camelize(event));
  const handler = props[handlerName];
  handler && handler(...args);
}
