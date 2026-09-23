import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import ts from "typescript";

type Reader = { exists: (path: string) => boolean; read: (path: string) => string };

// Follow local imports and re-exports rather than checking only entrypoint text.
export function publicDataLeaks(entries: string[], root: string, reader: Reader = {
  exists: existsSync,
  read: (path) => readFileSync(path, "utf8"),
}): string[][] {
  const visited = new Set<string>();
  const leaks: string[][] = [];
  const forbidden = new Set([
    resolve(root, "data/proyectos.json"),
    resolve(root, "src/lib/internal-projects.ts"),
  ]);
  function visit(path: string, chain: string[]) {
    if (forbidden.has(path)) { leaks.push([...chain, path]); return; }
    if (visited.has(path)) return;
    visited.add(path);
    if (!/\.[cm]?[jt]sx?$/.test(path)) return;
    const source = ts.createSourceFile(path, reader.read(path), ts.ScriptTarget.Latest, true);
    const references: string[] = [];
    function walk(node: ts.Node) {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
        && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const typeOnly = ts.isImportDeclaration(node) ? node.importClause?.isTypeOnly : node.isTypeOnly;
        if (!typeOnly) references.push(node.moduleSpecifier.text);
      }
      if (ts.isCallExpression(node)
        && (node.expression.kind === ts.SyntaxKind.ImportKeyword
          || (ts.isIdentifier(node.expression) && node.expression.text === "require"))) {
        const arg = node.arguments[0];
        if (!arg || !ts.isStringLiteral(arg)) throw new Error(`Nonliteral dependency in ${path}`);
        references.push(arg.text);
      }
      ts.forEachChild(node, walk);
    }
    walk(source);
    for (const name of references) {
      if (!name.startsWith(".") && !name.startsWith("@/")) continue;
      const base = name.startsWith("@/") ? resolve(root, "src", name.slice(2)) : resolve(dirname(path), name);
      const target = [base, `${base}.ts`, `${base}.tsx`, `${base}.mjs`, `${base}.js`, `${base}/index.ts`, `${base}/index.tsx`]
        .find(reader.exists);
      if (!target) throw new Error(`Unresolved dependency ${name} in ${path}`);
      visit(target, [...chain, path]);
    }
  }
  entries.forEach((entry) => visit(resolve(root, entry), []));
  return leaks;
}
