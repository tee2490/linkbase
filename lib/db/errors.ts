type MongoDuplicateKeyError = {
  code: 11000;
  keyPattern?: Record<string, unknown>;
};

export function isDuplicateKeyError(err: unknown, field: string): boolean {
  if (typeof err !== "object" || err === null || !("code" in err) || err.code !== 11000) {
    return false;
  }
  const { keyPattern } = err as MongoDuplicateKeyError;
  return keyPattern === undefined || field in keyPattern;
}
