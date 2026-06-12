export function createRequiredRuntimeReference<T>(name: string) {
  let runtime: T | null = null;

  return {
    get(): T {
      if (runtime) return runtime;
      throw new Error(`${name} runtime is not initialized`);
    },
    set(value: T) {
      if (runtime) {
        throw new Error(`${name} runtime is already initialized`);
      }
      runtime = value;
    },
  };
}
