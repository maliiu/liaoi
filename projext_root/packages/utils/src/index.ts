export function buildRedisKey(namespace: string, id: string | number) {
  return `${namespace}:${id}`;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
