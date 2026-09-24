// Read argv at call time; callers retain their own defaults and CLI dispatch.
export function readArgumentValue(name, argv = process.argv) {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}
