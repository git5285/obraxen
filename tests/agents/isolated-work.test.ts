import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { assertWorkOwnership, cleanGitEnvironment, digest, evaluateWorkTool, inspectPatch, matchesObservedCommand, safeFile, validateWorkManifest } from "../../automation/agents/isolated-work.mjs";
import type { WorkManifest } from "../../automation/agents/isolated-work.mjs";
import { validateBuilderOutput } from "../../automation/agents/contracts.mjs";
import type { BuilderOutput } from "../../automation/agents/contracts.mjs";

let manifest: WorkManifest;
beforeAll(() => {
  const output = execFileSync(process.execPath, ["automation/agents/isolated-cycle.mjs", "prepare"], { encoding: "utf8" });
  const prepared = JSON.parse(readFileSync(JSON.parse(output).fixtureFile, "utf8"));
  manifest = prepared.manifest;
});
const patch = "*** Begin Patch\n*** Update File: fixture.txt\n@@\n-Status: pending\n+Status: verified\n*** End Patch";
const asRole = (role: string) => ({ ...manifest, phase: ({ scout: "discovery", builder: "implementation", auditor: "review" } as const)[role as "scout"] });

describe("isolated fixture authority", () => {
  it("correlates the host shell envelope exactly, never by a commandActions hint", () => {
    const command = "'/absolute/node' '/absolute/read.mjs'";
    const observed = { command: `/bin/zsh -lc "${command}"`, cwd: "/candidate" };
    expect(matchesObservedCommand(observed, command, "/candidate")).toBe(true);
    expect(matchesObservedCommand({ ...observed, cwd: "/other" }, command, "/candidate")).toBe(false);
    expect(matchesObservedCommand({ ...observed, command: observed.command + "; touch other" }, command, "/candidate")).toBe(false);
    expect(matchesObservedCommand({ ...observed, command: '/bin/zsh -lc "unrelated"' }, command, "/candidate")).toBe(false);
  });
  it("places the hook in the Git common checkout outside the candidate writer root", () => {
    const common = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], {
      cwd: manifest.worktree, env: cleanGitEnvironment(), encoding: "utf8",
    }).trim();
    expect(common).toBe(join(manifest.controlRoot, ".git"));
    expect(readFileSync(join(manifest.worktree, ".codex/config.toml"), "utf8")).toContain("Fixture");
    const definition = JSON.parse(readFileSync(join(manifest.controlRoot, ".codex/hooks.json"), "utf8"));
    expect(definition.hooks.PreToolUse[0]).toMatchObject({ matcher: ".*", hooks: [{
      type: "command", command: `'${process.execPath}' '${manifest.hookPath}'`, timeout: 5,
    }] });
  });
  it("real hook entry emits context without unsupported allow on an exact read", () => {
    const root = mkdtempSync(join(tmpdir(), "obraxen-hook-wire-"));
    const path = join(root, "manifest.json");
    const raw = JSON.stringify(manifest);
    writeFileSync(path, raw);
    const output = execFileSync(process.execPath, [resolve("automation/agents/isolated-work.mjs")], {
      input: JSON.stringify({ tool_use_id: "test-call", turn_id: "test-turn", tool_name: "Bash",
        tool_input: { command: manifest.commands[0].command } }), encoding: "utf8",
      env: { ...process.env, OBRAXEN_ISOLATED_MODE: "fixture", OBRAXEN_ISOLATED_ROLE: "scout",
        OBRAXEN_WORK_MANIFEST: path, OBRAXEN_WORK_MANIFEST_DIGEST: digest(raw) },
    });
    const result = JSON.parse(output).hookSpecificOutput;
    expect(result.permissionDecision).toBeUndefined();
    expect(Object.keys(result).sort()).toEqual(["additionalContext", "hookEventName"]);
    expect(result.additionalContext).toContain('"callId":"test-call"');
  });
  it("validates a controller-created disposable manifest", () => {
    expect(validateWorkManifest(manifest)).toBe(manifest);
    expect(assertWorkOwnership(manifest)).toBe(true);
  });
  it.each(["../outside", "/tmp/outside", "fixture.txt/../other", "a//b", ".env", ".codex/config.toml"])("rejects unsafe or protected write %s", (path) => {
    expect(() => validateWorkManifest({ ...manifest, allowedPaths: [path] })).toThrow();
  });
  it("refuses the production checkout as fixture", () => {
    expect(() => validateWorkManifest({ ...manifest, controlRoot: process.cwd() })).toThrow();
  });
  it("requires an unexpired manifest", () => {
    expect(() => assertWorkOwnership({ ...manifest, expiresAt: "2020-01-01T00:00:00Z" })).toThrow("expired_manifest");
  });
  it("requires live claim and lease before implementation", () => {
    expect(() => assertWorkOwnership(asRole("builder"))).toThrow("claim_mismatch");
  });
  it("requires immutable check evidence", () => {
    const changed = structuredClone(manifest);
    changed.commands[0].digest = "0".repeat(64);
    expect(() => assertWorkOwnership(changed)).toThrow("check_changed");
  });
  it("permits only a builder patch with exact scope", () => {
    expect(evaluateWorkTool({ tool_name: "apply_patch", tool_input: { command: patch } }, "builder", asRole("builder"), () => true)).toBe(true);
    expect(() => evaluateWorkTool({ tool_name: "apply_patch", tool_input: patch }, "auditor", asRole("auditor"), () => true)).toThrow("read_only_role");
  });
  it.each(["Bash", "exec_command"])("permits an exact assigned %s command", (name) => {
    expect(evaluateWorkTool({ tool_name: name, tool_input: { [name === "Bash" ? "command" : "cmd"]: manifest.commands[0].command } }, "scout", manifest, () => true)).toBe(true);
  });
  it.each(["; pwd", " --help", " && true", "\ntrue", " | sh"])("denies added shell syntax %s", (suffix) => {
    expect(() => evaluateWorkTool({ tool_name: "Bash", tool_input: { command: manifest.commands[0].command + suffix } }, "scout", manifest, () => true)).toThrow("command_not_allowed");
  });
  it.each(["mcp__external", "spawn_agent", "functions.exec", "unknown"])("denies unrelated tool %s", (tool_name) => {
    expect(() => evaluateWorkTool({ tool_name, tool_input: {} }, "builder", asRole("builder"), () => true)).toThrow("tool_not_allowed");
  });
  it("denies role spoofing, cwd, shell and permission overrides", () => {
    expect(() => evaluateWorkTool({ tool_name: "exec_command", tool_input: { command: manifest.commands[0].command, cmd: "other" } }, "scout", manifest, () => true)).toThrow("ambiguous_command_input");
    expect(() => evaluateWorkTool({}, "builder", manifest, () => true)).toThrow("role_phase_mismatch");
    for (const option of [{ cwd: "/" }, { shell: "/bin/zsh" }, { env: {} }, { sandbox_permissions: "require_escalated" }]) {
      expect(() => evaluateWorkTool({ tool_name: "Bash", tool_input: { command: manifest.commands[0].command, ...option } }, "scout", manifest, () => true)).toThrow();
    }
  });
  it("denies deletions, moves and out-of-scope patches", () => {
    for (const body of [patch.replace("fixture.txt", "other.txt"), patch.replace("Update File", "Delete File"), patch.replace("@@", "*** Move to: other.txt\n@@")]) {
      expect(() => inspectPatch(body, manifest)).toThrow();
    }
  });
  it("rejects symlinks including dangling symlinks", () => {
    const root = mkdtempSync(join(tmpdir(), "obraxen-path-test-"));
    writeFileSync(join(root, "real"), "fixture");
    symlinkSync(join(root, "real"), join(root, "link"));
    symlinkSync(join(root, "absent"), join(root, "dangling"));
    expect(() => safeFile(root, "link")).toThrow("symlink_path");
    expect(() => safeFile(root, "dangling", { missing: true })).toThrow("symlink_path");
  });
  it("drops all inherited Git redirection variables", () => {
    expect(cleanGitEnvironment({ PATH: "safe", NODE_ENV: "test", GIT_DIR: "elsewhere", GIT_CONFIG_COUNT: "2" })).toEqual({ PATH: "safe", NODE_ENV: "test" });
  });
  it("real hook entry denies malformed binding without echoing input", () => {
    const output = execFileSync(process.execPath, [resolve("automation/agents/isolated-work.mjs")], {
      input: "private-canary-not-a-secret", encoding: "utf8", env: { ...process.env, OBRAXEN_ISOLATED_MODE: "fixture", OBRAXEN_WORK_MANIFEST: "/missing" },
    });
    expect(JSON.parse(output).hookSpecificOutput.permissionDecision).toBe("deny");
    expect(output).not.toContain("private-canary");
  });
});

describe("retained failure contract", () => {
  const output = (): BuilderOutput => ({ schemaVersion: 4, status: "blocked", attentionClass: "reliability", runId: "run-fixture",
    candidateId: "candidate-fixture", baseSha: "a".repeat(40), runtimeFingerprint: "b".repeat(64), changedPaths: ["fixture.txt"],
    checksRun: [{ command: "fixture-check", status: "failed", summary: "retained for inspection" }], residualRisks: ["failed fixture check"], reason: "Correction limit reached" });
  it("preserves failed diff without claiming implementation success", () => expect(validateBuilderOutput(output()).status).toBe("blocked"));
  it("requires explicit residual risk", () => expect(() => validateBuilderOutput({ ...output(), residualRisks: [] })).toThrow("residualRisks"));
  it("does not allow no_op with changes", () => expect(() => validateBuilderOutput({ ...output(), status: "no_op" })).toThrow("no_op"));
  it("does not allow implemented with failed checks", () => expect(() => validateBuilderOutput({ ...output(), status: "implemented" })).toThrow("failed checks"));
});

describe("deterministic fixture lifecycle (not model evidence)", () => {
  it.each(["pass", "failed-check", "veto", "new-malformed-claim"])("closes claims and lease after %s, retaining candidate", (mode) => {
    const source = `
      import assert from 'node:assert/strict';
      import {execFileSync} from 'node:child_process';
      import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
      import {prepareFixture,runFixture} from './automation/agents/isolated-cycle.mjs';
      import {readLease} from './automation/agents/lease.mjs';
      import {readOperationalClaims} from './automation/agents/operations.mjs';
      import {evaluateWorkTool} from './automation/agents/isolated-work.mjs';
      const prepared=prepareFixture(), m=prepared.manifest, mode=${JSON.stringify(mode)};
      const finding={id:'fixture-status',domain:'maintainability',summary:'Verify fixture status',
        evidence:[{kind:'repository_fact',source:'fixture.txt:1',fact:'Status is pending'}],
        impact:'low',confidence:'high',risk:'low',candidatePaths:['fixture.txt'],verification:['fixture check'],conflicts:[]};
      const runner=async (p,role,prompt)=>{
        const common={runId:m.runId,candidateId:m.candidateId,baseSha:m.baseSha,runtimeFingerprint:m.runtimeFingerprint,attentionClass:m.attentionClass};
        if(role==='scout') {
          if(mode==='new-malformed-claim') {
            mkdirSync(m.controlRoot+'/.coordination/claims',{recursive:true});
            writeFileSync(m.controlRoot+'/.coordination/claims/malformed.md','# malformed claim');
          }
          return {threadId:'scripted-scout',result:{...common,status:'proposal',findings:[finding],recommendedId:finding.id}};
        }
        if(role==='builder') {
          assert.notEqual(mode,'new-malformed-claim','builder must not launch after new scan failure');
          assert(prompt.includes('"leaseAcquired":true'));
          assert(prompt.includes('"registeredClaim":"'+m.claimPath+'"'));
          assert(prompt.includes('"trigger":"human_request"'));
          assert(prompt.includes('"selectedFinding":{'));
          assert(prompt.includes('"activationBaseline":{"publicationAuthorized":false,"publishSwitch":false}'));
          const patch=${JSON.stringify(patch)};
          assert(evaluateWorkTool({tool_name:'apply_patch',tool_input:{command:patch}},role,m));
          execFileSync('apply_patch',[patch],{cwd:m.worktree,stdio:'pipe'});
          if(mode==='failed-check') throw new Error('intentional_test_failure');
          return {threadId:'scripted-builder',result:{...common,status:'implemented',changedPaths:['fixture.txt']}};
        }
        return {threadId:'scripted-auditor',result:{...common,verdict:mode==='veto'?'veto':'pass'}};
      };
      let succeeded=false;
      let failure;
      try { const result=await runFixture(prepared,runner); succeeded=result.status==='fixture_passed'; } catch(e) {failure=e.message;}
      if(mode==='new-malformed-claim') assert.equal(failure,'fixture_snapshot_coordination_blocked');
      assert.equal(succeeded,mode==='pass');
      assert.equal(readLease(m.controlRoot,m.stateHome),null);
      assert.equal(readOperationalClaims(m.controlRoot,m.stateHome)[0].state,'liberado');
      assert.equal(readFileSync(m.worktree+'/fixture.txt','utf8'),mode==='new-malformed-claim'?'Status: pending\\n':'Status: verified\\n');
      console.log(JSON.stringify({mode,closed:true,retained:true}));
    `;
    const output = execFileSync(process.execPath, ["--input-type=module", "-e", source], { encoding: "utf8", timeout: 30000 });
    expect(JSON.parse(output)).toMatchObject({ mode, closed: true, retained: true });
  });
  it.each(["lost-lease", "unconfirmed-host"])("retains ownership and evidence on %s", (mode) => {
    const source = `
      import assert from 'node:assert/strict';
      import {readFileSync} from 'node:fs';
      import {prepareFixture,runFixture} from './automation/agents/isolated-cycle.mjs';
      import {readLease,releaseLease} from './automation/agents/lease.mjs';
      import {readOperationalClaims} from './automation/agents/operations.mjs';
      const p=prepareFixture(), m=p.manifest, mode=${JSON.stringify(mode)};
      const finding={id:'fixture-status',domain:'maintainability',summary:'Verify fixture status',
        evidence:[{kind:'repository_fact',source:'fixture.txt:1',fact:'Status is pending'}],
        impact:'low',confidence:'high',risk:'low',candidatePaths:['fixture.txt'],verification:['fixture check'],conflicts:[]};
      try { await runFixture(p,async (_,role)=>{
        if(role==='scout') return {result:{status:'proposal',baseSha:m.baseSha,runtimeFingerprint:m.runtimeFingerprint,
          attentionClass:m.attentionClass,findings:[finding],recommendedId:finding.id}};
        if(mode==='lost-lease') releaseLease(m.controlRoot,m.leaseToken,m.stateHome);
        else p.hostTerminationConfirmed=false;
        throw new Error('injected_fixture_failure');
      }); assert.fail('must block'); } catch(e) {assert.equal(e.message,'fixture_closure_incomplete');}
      const outcome=JSON.parse(readFileSync(p.root+'/outcome.json','utf8'));
      assert.equal(outcome.status,'blocked');
      assert.equal(outcome.retainedDiff,false);
      assert(outcome.closureErrors.includes(mode==='lost-lease'?'lease_release_failed':'host_termination_unconfirmed'));
      assert.equal(readOperationalClaims(m.controlRoot,m.stateHome)[0].state,'en_curso');
      if(mode==='unconfirmed-host') {
        assert(readLease(m.controlRoot,m.stateHome));
        // This test never spawned a host. Release its private fixture lease only.
        releaseLease(m.controlRoot,m.leaseToken,m.stateHome);
      }
      console.log('closure-safety-passed');
    `;
    expect(execFileSync(process.execPath, ["--input-type=module", "-e", source], { encoding: "utf8", timeout: 30000 })).toContain("closure-safety-passed");
  });
});
