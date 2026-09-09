import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  canonicalDependencyTree,
  createRuntimeFingerprint,
  inspectRuntime,
  inspectDependencyTree,
  readRuntimeContract,
} from "../../automation/agents/runtime.mjs";

const roots: string[] = [];
const dependencyDigest = "d".repeat(64);

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "obraxen-runtime-"));
  roots.push(root);
  writeFileSync(join(root, ".nvmrc"), "24.18.0\n");
  writeFileSync(join(root, "package.json"), JSON.stringify({
    engines: { node: "24.18.0" },
    packageManager: "npm@11.16.0",
  }));
  writeFileSync(join(root, "package-lock.json"), "{}\n");
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("pinned agent runtime", () => {
  it.each([
    "null", "true", "42", '"tree"', "[]", "{",
    '{"dependencies":null}', '{"dependencies":[]}', '{"dependencies":"bad"}',
    '{"dependencies":{"child":true}}', '{"dependencies":{"child":[]}}',
    '{"dependencies":{"child":{"version":42}}}', '{"version":""}',
    '{"problems":"invalid"}', '{"problems":[42]}', '{"problems":["missing"]}',
    '{"dependencies":{"child":{"problems":"invalid"}}}',
    '{"dependencies":{"child":{"problems":["invalid dependency"]}}}',
    '{"dependencies":{"child":{"missing":true}}}',
    '{"dependencies":{"child":{"invalid":"^1.0.0"}}}',
    '{"dependencies":{"child":{"extraneous":true}}}',
    '{"dependencies":{"child":{"error":{"code":"ELSPROBLEMS"}}}}',
  ])("rejects malformed or problematic npm trees: %s", (stdout) => {
    const dependencies = inspectDependencyTree({status: 0, stdout, stderr: ""});
    expect(dependencies).toMatchObject({valid: false, digest: null});
    expect(inspectRuntime(fixture(), {
      nodeVersion: "24.18.0", npmVersion: "11.16.0", dependencies,
      native: {valid: true, error: null},
    })).toMatchObject({ok: false, fingerprint: null, blockers: ["dependency_tree_invalid"]});
  });

  it.each([
    {},
    {name: "fixture", dependencies: {}},
    {dependencies: {optionalForAnotherPlatform: {}}},
    {dependencies: {alpha: {version: "1.2.3", resolved: "file:../alpha", dependencies: {beta: {version: "2.0.0"}}}}},
    {problems: [], dependencies: {alias: {name: "actual-name", version: "1.0.0", deduped: true, missing: false}}},
  ])("preserves valid npm shapes and the existing digest: %j", (tree) => {
    const result = inspectDependencyTree({status: 0, stdout: JSON.stringify(tree), stderr: ""});
    const expected = createHash("sha256").update(JSON.stringify(canonicalDependencyTree(tree))).digest("hex");
    expect(result).toEqual({valid: true, digest: expected, problems: [], error: null});
  });

  it("retains process failures and nested npm problem evidence", () => {
    expect(inspectDependencyTree({status: null, stdout: "{}", stderr: "process failed"}))
      .toEqual({valid: false, digest: null, problems: [], error: "process failed"});
    expect(inspectDependencyTree({status: 1, stdout: "{}", stderr: "npm failed"}))
      .toMatchObject({valid: false, digest: null, error: "npm failed"});
    expect(inspectDependencyTree({status: 0, stdout: '{"dependencies":{"child":{"problems":["missing child"]}}}', stderr: ""}))
      .toMatchObject({valid: false, digest: null, problems: ["missing child"]});
  });

  it("transports large escaped output without lowering the original per-stream limit", () => {
    const source = `
      import assert from 'node:assert/strict';
      import {encodeRuntimeProbes,decodeRuntimeProbes,PROBE_BUFFER_BYTES,PROBE_TRANSPORT_BYTES} from './automation/agents/runtime-probe.mjs';
      const text='"'.repeat(9*1024*1024);
      const results={dependencies:{status:0,stdout:text,stderr:''}};
      assert(Buffer.byteLength(JSON.stringify(results))>PROBE_BUFFER_BYTES);
      const wire=encodeRuntimeProbes(results);
      assert(Buffer.byteLength(wire)<PROBE_TRANSPORT_BYTES);
      assert.equal(decodeRuntimeProbes(wire).dependencies.stdout,text);
      for(const bad of ['null','[]','{}',JSON.stringify({encoding:'base64-v1',results:{native:{status:0,stdout:'!',stderr:''}}})])
        assert.throws(()=>decodeRuntimeProbes(bad));
      assert.throws(()=>encodeRuntimeProbes({native:{status:0,stdout:Buffer.alloc(PROBE_BUFFER_BYTES+1),stderr:''}}));
      console.log('bounded-transport-passed');
    `;
    expect(execFileSync(process.execPath, ["--input-type=module", "-e", source],
      { encoding: "utf8", timeout: 3000 })).toContain("bounded-transport-passed");
  });
  it("launches independent probes together, retains failures and never caches observations", () => {
    const source = `
      import assert from 'node:assert/strict';
      import {collectRuntimeProbes} from './automation/agents/runtime-probe.mjs';
      const calls=[], pending=[];
      const run=(file,args)=>new Promise(resolve=>{
        calls.push({file,args}); pending.push(resolve);
        if(pending.length===3) queueMicrotask(()=>pending.splice(0).forEach((done,i)=>done({status:i===1?1:0,stdout:String(i),stderr:i===1?'invalid dependencies':''})));
      });
      for(let i=0;i<2;i++) {
        const results=await collectRuntimeProbes({npm:true,dependencies:true,native:true},run);
        assert.equal(results.dependencies.status,1);
        assert.equal(results.npm.status,0); assert.equal(results.native.status,0);
      }
      assert.equal(calls.length,6);
      assert.deepEqual(calls[0].args,['--version']);
      assert.deepEqual(calls[1].args,['ls','--all','--json']);
      assert(calls[2].args.includes("await import('rolldown')"));
      await assert.rejects(collectRuntimeProbes({unexpected:true},run));
      console.log('fresh-parallel-probes-passed');
    `;
    expect(execFileSync(process.execPath, ["--input-type=module", "-e", source],
      { encoding: "utf8", timeout: 2000 })).toContain("fresh-parallel-probes-passed");
  });

  it("fails closed on dependency or native errors even with correct version pins", () => {
    const root = fixture();
    const common = { nodeVersion: "24.18.0", npmVersion: "11.16.0",
      dependencies: {valid: true, digest: dependencyDigest, problems: [], error: null},
      native: {valid: true, error: null} };
    expect(inspectRuntime(root, {...common, dependencies: {...common.dependencies, valid: false}}))
      .toMatchObject({ok: false, fingerprint: null, blockers: ["dependency_tree_invalid"]});
    expect(inspectRuntime(root, {...common, native: {valid: false, error: "native failed"}}))
      .toMatchObject({ok: false, fingerprint: null, blockers: ["native_binding_invalid"]});
    const initial = inspectRuntime(root, common);
    writeFileSync(join(root, "package-lock.json"), '{"changed":true}\n');
    expect(inspectRuntime(root, common).fingerprint).not.toBe(initial.fingerprint);
  });
  it("requires exact matching Node and npm pins", () => {
    const root = fixture();
    expect(readRuntimeContract(root)).toMatchObject({
      nodeVersion: "24.18.0",
      npmVersion: "11.16.0",
    });

    writeFileSync(join(root, ".nvmrc"), "24\n");
    expect(() => readRuntimeContract(root)).toThrow("exact Node.js version");
  });

  it("canonicalizes dependency order before computing a stable fingerprint", () => {
    const left = canonicalDependencyTree({
      dependencies: { zeta: { version: "2.0.0" }, alpha: { version: "1.0.0" } },
    });
    const right = canonicalDependencyTree({
      dependencies: { alpha: { version: "1.0.0" }, zeta: { version: "2.0.0" } },
    });
    expect(left).toEqual(right);
    expect(createRuntimeFingerprint({
      nodeVersion: "24.18.0",
      npmVersion: "11.16.0",
      platform: "darwin",
      arch: "arm64",
      lockfileSha256: "a".repeat(64),
      dependencyTreeSha256: "b".repeat(64),
    })).toMatch(/^[0-9a-f]{64}$/);
  });

  it("fails closed when either runtime version differs", () => {
    const options = {
      dependencies: { valid: true, problems: [], digest: dependencyDigest, error: null },
      native: { valid: true, error: null },
      platform: "darwin",
      arch: "arm64",
    };
    const valid = inspectRuntime(fixture(), {
      ...options,
      nodeVersion: "24.18.0",
      npmVersion: "11.16.0",
    });
    expect(valid.ok).toBe(true);
    expect(valid.fingerprint).toMatch(/^[0-9a-f]{64}$/);

    const drift = inspectRuntime(fixture(), {
      ...options,
      nodeVersion: "26.5.0",
      npmVersion: "12.0.0",
    });
    expect(drift).toMatchObject({
      ok: false,
      fingerprint: null,
      blockers: ["node_version_mismatch", "npm_version_mismatch"],
    });
  });
});
