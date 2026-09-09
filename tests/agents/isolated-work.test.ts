import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { assertWorkOwnership, cleanGitEnvironment, digest, evaluateWorkTool, inspectPatch, inspectWorkOwnership, matchesObservedCommand, safeFile, validateWorkManifest } from "../../automation/agents/isolated-work.mjs";
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
  it("returns a freshly verified runtime without accepting caller-supplied evidence", () => {
    expect(inspectWorkOwnership(manifest)).toMatchObject({ok: true, fingerprint: manifest.runtimeFingerprint});
    expect(() => inspectWorkOwnership({...manifest, runtimeFingerprint: "0".repeat(64)})).toThrow("runtime_changed");
  });
  it("rechecks immutable scripts after a previous successful ownership inspection", () => {
    const script = manifest.commands[0].script;
    const original = readFileSync(script, "utf8");
    expect(inspectWorkOwnership(manifest).ok).toBe(true);
    try {
      writeFileSync(script, original + "\n// changed after inspection\n");
      expect(() => inspectWorkOwnership(manifest)).toThrow("check_changed");
    } finally { writeFileSync(script, original); }
  });
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

describe("work transport malformed host events (scripted host, no model)", () => {
  it.each([false, true])("checks trailing protocol failure before returning inspectOnly: %s", (malformed) => {
    const hostRoot = mkdtempSync(join(tmpdir(), "obraxen-inspect-tail-"));
    const codex = join(hostRoot, "codex");
    writeFileSync(codex, `#!/usr/bin/env node
      require('node:readline').createInterface({input:process.stdin}).on('line',line=>{
        const request=JSON.parse(line);
        if(request.id===undefined) return;
        const p=request.params;
        const result=request.method==='thread/start'
          ? {thread:{id:'fake-thread'},model:p.model,cwd:p.cwd,approvalPolicy:'never',
            runtimeWorkspaceRoots:[p.cwd],sandbox:{type:'readOnly',networkAccess:false}}
          : request.method==='hooks/list'?{data:[]}:{};
        process.stdout.write(JSON.stringify({id:request.id,result})+'\\n'+
          (request.method==='hooks/list' && ${malformed}
            ? JSON.stringify({method:'item/started',params:{}})+'\\n':''));
      });`, { mode: 0o700 });
    const source = `
      import assert from 'node:assert/strict';
      import {readFileSync} from 'node:fs';
      import {dirname,join} from 'node:path';
      import {runFixtureRole} from './automation/agents/isolated-cycle.mjs';
      const prepared=JSON.parse(readFileSync(join(dirname(${JSON.stringify(manifest.worktree)}),'fixture.json'),'utf8'));
      const result=runFixtureRole(prepared,'scout','',{codex:${JSON.stringify(codex)},timeoutMs:3000,inspectOnly:true});
      if(${malformed}) await assert.rejects(result,/invalid_host_event/);
      else assert.equal((await result).modelTurnsStarted,0);
      assert.equal(prepared.hostTerminationConfirmed,true);
      console.log('inspect-tail-checked');
    `;
    expect(execFileSync(process.execPath, ["--input-type=module", "-e", source], {
      encoding: "utf8", timeout: 30000,
    })).toContain("inspect-tail-checked");
  }, 35000);

  it.each([
    { method: "item/started", params: {} },
    { method: "item/completed", params: null },
    { method: "item/completed", params: { threadId: "t", turnId: "u", item: { id: "i", type: "agentMessage", text: {} } } },
    { method: "hook/completed", params: {} },
    { method: "hook/completed", params: { run: { entries: [null] } } },
    { method: "turn/completed", params: {} },
  ])("rejects malformed $method and confirms process-group termination", (message) => {
    const hostRoot = mkdtempSync(join(tmpdir(), "obraxen-malformed-host-"));
    const pidPath = join(hostRoot, "pid"), codex = join(hostRoot, "codex");
    writeFileSync(codex, `#!/usr/bin/env node\nconst fs=require('node:fs');
      fs.writeFileSync(${JSON.stringify(pidPath)},String(process.pid));
      process.on('SIGTERM',()=>{});
      process.stdout.write(${JSON.stringify(JSON.stringify(message) + "\n")});
      setInterval(()=>{},1000);`, { mode: 0o700 });
    // An uncaught callback exception must fail a child, not terminate Vitest.
    const source = `
      import assert from 'node:assert/strict';
      import {readFileSync} from 'node:fs';
      import {dirname,join} from 'node:path';
      import {runFixtureRole} from './automation/agents/isolated-cycle.mjs';
      const prepared=JSON.parse(readFileSync(join(dirname(${JSON.stringify(manifest.worktree)}),'fixture.json'),'utf8'));
      await assert.rejects(runFixtureRole(prepared,'scout','no model work',
        {codex:${JSON.stringify(codex)},timeoutMs:3000}),/invalid_host_event/);
      assert.equal(prepared.hostTerminationConfirmed,true);
      const pid=Number(readFileSync(${JSON.stringify(pidPath)},'utf8'));
      assert.throws(()=>process.kill(-pid,0),{code:'ESRCH'});
      console.log('malformed-event-closed');
    `;
    expect(execFileSync(process.execPath, ["--input-type=module", "-e", source], {
      encoding: "utf8", timeout: 30000,
    })).toContain("malformed-event-closed");
  }, 35000);
});

describe("deterministic fixture lifecycle (not model evidence)", () => {
  it.each(["pass", "failed-check", "veto", "new-malformed-claim", "handoff-failure", "claim-failure", "report-failure", "publication-failure"])("reports truthful closure after %s, retaining candidate", (mode) => {
    const source = `
      import assert from 'node:assert/strict';
      import {execFileSync} from 'node:child_process';
      import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
      import fs from 'node:fs';
      import {syncBuiltinESMExports} from 'node:module';
      import {prepareFixture,runFixture} from './automation/agents/isolated-cycle.mjs';
      import {readLease} from './automation/agents/lease.mjs';
      import {readOperationalClaims} from './automation/agents/operations.mjs';
      import {readMemoryState} from './automation/agents/memory.mjs';
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
          // Scripted builder fixture, not a model/tool execution: no Codex CLI dependency.
          assert.equal(readFileSync(m.worktree+'/fixture.txt','utf8'),'Status: pending\\n');
          writeFileSync(m.worktree+'/fixture.txt','Status: verified\\n');
          if(mode==='failed-check') throw new Error('intentional_test_failure');
          return {threadId:'scripted-builder',result:{...common,status:'implemented',changedPaths:['fixture.txt']}};
        }
        // Inject filesystem failures only in this subprocess's private fixture.
        const originalWrite=fs.writeFileSync, originalRename=fs.renameSync;
        fs.writeFileSync=(path,...args)=>{
          if(mode==='handoff-failure' && String(path)===m.controlRoot+'/.coordination/handoffs/'+m.threadId+'.md') throw new Error('injected_handoff_failure');
          return originalWrite(path,...args);
        };
        fs.renameSync=(from,to)=>{
          const target=String(to);
          if(mode==='claim-failure' && target.endsWith('/'+m.threadId+'-liberado.json')) throw new Error('injected_claim_failure');
          if(mode==='report-failure' && target.startsWith(p.root+'/memory-pending-') && target.endsWith('/state.json')) throw new Error('injected_partial_report_failure');
          if(mode==='publication-failure' && target===p.root+'/memory') throw new Error('injected_publication_failure');
          return originalRename(from,to);
        };
        syncBuiltinESMExports();
        return {threadId:'scripted-auditor',result:{...common,verdict:mode==='veto'?'veto':'pass'}};
      };
      let succeeded=false;
      let failure;
      try { const result=await runFixture(prepared,runner); succeeded=result.status==='fixture_passed'; } catch(e) {failure=e.message;}
      if(mode==='new-malformed-claim') assert.equal(failure,'fixture_snapshot_coordination_blocked');
      assert.equal(succeeded,mode==='pass');
      assert.equal(readLease(m.controlRoot,m.stateHome),null);
      const claimState=readOperationalClaims(m.controlRoot,m.stateHome)[0].state;
      assert.equal(claimState,['handoff-failure','claim-failure','report-failure'].includes(mode)?'esperando_revision':'liberado');
      assert.equal(readFileSync(m.worktree+'/fixture.txt','utf8'),mode==='new-malformed-claim'?'Status: pending\\n':'Status: verified\\n');
      const finalOutcome=JSON.parse(readFileSync(prepared.root+'/outcome.json','utf8'));
      assert.equal(finalOutcome.status,mode==='pass'?'fixture_passed':'blocked');
      const memory=readMemoryState({root:prepared.root+'/memory'});
      if(['report-failure','publication-failure'].includes(mode)) assert.equal(memory.runs.lifetimeCount,0);
      else {
        assert.equal(memory.runs.lifetimeCount,1);
        assert.equal(memory.recentRuns[0].status,mode==='pass'?'local_diff':'blocked');
        const record=JSON.parse(readFileSync(prepared.root+'/memory/runs/'+memory.runIndex[0].recordPath,'utf8'));
        assert.equal(record.status,mode==='pass'?'local_diff':'blocked');
      }
      if(mode.endsWith('-failure')) {
        assert.equal(failure,'fixture_closure_incomplete');
        assert.equal(finalOutcome.claimState,claimState);
      }
      console.log(JSON.stringify({mode,closed:true,retained:true}));
    `;
    const output = execFileSync(process.execPath, ["--input-type=module", "-e", source], { encoding: "utf8", timeout: 30000 });
    expect(JSON.parse(output)).toMatchObject({ mode, closed: true, retained: true });
  }, 35000);
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
  }, 35000);
});
