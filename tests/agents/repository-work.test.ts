import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { digest, cleanGitEnvironment } from "../../automation/agents/isolated-work.mjs";
import { loadPolicy } from "../../automation/agents/policy.mjs";
import { REPOSITORY_EXECUTION_ENABLED, REPOSITORY_ORIGIN, repositoryPath, validateRepositoryManifest,
  assertRepositorySnapshot, inspectRepositoryPatch, evaluateRepositoryTool } from "../../automation/agents/repository-work.mjs";

const path="src/app/[lang]/page.tsx";
let root:string, worktree:string, manifest:ReturnType<typeof createManifest>;
const files={"package.json":"{}","package-lock.json":"{}",".nvmrc":"24.18.0",".npmrc":"ignore-scripts=true",
  "AGENTS.md":"Local test instructions","COORDINATION.md":"Local test coordination",[path]:"export default 'pending';\n"};
let policy:ReturnType<typeof loadPolicy>;
const git=(cwd:string,args:string[])=>execFileSync("git",["-c","core.hooksPath=/dev/null",...args],{cwd,env:cleanGitEnvironment(),encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
function createManifest(baseSha:string) {
  const command=(role:string,kind:string)=>({role,kind,executable:process.execPath,script:join(root,"read.mjs"),
    command:`'${process.execPath}' '${join(root,"read.mjs")}'`,digest:digest(readFileSync(join(root,"read.mjs")))});
  const finding={id:"reviewed-local-change",domain:"ux",summary:"Update existing route",candidatePaths:[path],confidence:"high",risk:"low",
    impact:"low",evidence:[{kind:"repository_fact",source:path+":1",fact:"The test route contains pending"}],verification:["reviewed local check"],conflicts:[]};
  return {schemaVersion:1,scope:"repository",phase:"implementation",trigger:"human_request",parentRunId:null,
    runId:"run-local-test",candidateId:"candidate-local-test",threadId:"thread-local-test",baseSha,attentionClass:"product",
    runtimeFingerprint:"a".repeat(64),controllerRuntimeFingerprint:"b".repeat(64),controlRoot:join(root,"control"),worktree,
    stateHome:join(root,"state"),evidenceRoot:join(root,"evidence"),hookPath:resolve("automation/agents/repository-work.mjs"),
    hookDigest:digest(readFileSync(resolve("automation/agents/repository-work.mjs"))),claimPath:".coordination/claims/thread-local-test.md",
    claimDigest:"c".repeat(64),leaseToken:"local-disposable-test-token",createdAt:new Date().toISOString(),
    expiresAt:new Date(Date.now()+600000).toISOString(),allowedPaths:[path],readPaths:[path,"AGENTS.md","COORDINATION.md"],
    selectedFinding:finding,scoutEvidence:{schemaVersion:4,status:"proposal",attentionClass:"product",baseSha,runtimeFingerprint:"a".repeat(64),
      activeClaims:[],findings:[finding],recommendedId:finding.id,reason:"Explicit temporary fixture"},
    acceptanceChecks:[command("builder","check").command],activationBaseline:{schemaVersion:1,
      decision:"NO-GO",candidateAuditRequired:true,publicationAuthorized:false,publishSwitch:false,blockers:[],blockerCount:0},
    candidateIntegrity:Object.fromEntries(Object.keys(files).filter(p=>p!==path).map(p=>[p,digest(readFileSync(join(worktree,p)))])),
    controllerIntegrity:Object.fromEntries(["repository-work.mjs","repository-cycle.mjs","isolated-transport.mjs","isolated-work.mjs","policy.json"]
      .map(n=>[n,digest(readFileSync(resolve("automation/agents",n)))])),
    commands:[command("builder","read"),command("builder","check"),command("auditor","read"),command("auditor","check")]};
}
beforeAll(()=>{
  root=realpathSync(mkdtempSync(join(tmpdir(),"obraxen-repository-adapter-")));
  const control=join(root,"control"); worktree=join(root,"candidate");
  for(const p of [control,join(root,"state"),join(root,"evidence")])mkdirSync(p);
  for(const [p,body] of Object.entries(files)){mkdirSync(dirname(join(control,p)),{recursive:true});writeFileSync(join(control,p),body);}
  git(control,["init","-q"]);git(control,["remote","add","origin",REPOSITORY_ORIGIN]);
  git(control,["add","--",...Object.keys(files)]);
  git(control,["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","-qm","Local fixture"]);
  const base=git(control,["rev-parse","HEAD"]);git(control,["worktree","add","--detach",worktree,base]);
  writeFileSync(join(root,"read.mjs"),"console.log('local test only');\n");
  policy=structuredClone(loadPolicy());policy.coordination.stateHome=join(root,"state");manifest=createManifest(base);
});
const snapshot=()=>({baseSha:manifest.baseSha,runtime:{ok:true,fingerprint:manifest.runtimeFingerprint},
  blockers:["writer_lease_exists","active_writer_claim_limit"],activeClaims:[{threadId:manifest.threadId,files:[path]}],
  operationalClaims:[{threadId:manifest.threadId,state:"en_curso",claim:{source:manifest.claimPath,contentDigest:manifest.claimDigest,files:[path]}}],
  lease:{token:manifest.leaseToken,runId:manifest.runId,baseSha:manifest.baseSha,worktree,claimPath:manifest.claimPath,paths:[path]}});

describe("disabled repository adapter",()=>{
  it("tells the model the same relative-only update contract enforced by the guard",()=>{
    const instructions=execFileSync(process.execPath,["--input-type=module","-e",
      "import {REPOSITORY_PATCH_INSTRUCTIONS} from './automation/agents/repository-cycle.mjs';console.log(REPOSITORY_PATCH_INSTRUCTIONS);"],{encoding:"utf8"});
    expect(instructions).toContain("exact repository-relative spelling from manifest.allowedPaths");
    expect(instructions).toContain("never an absolute path");
    const patch=`*** Begin Patch\n*** Update File: ${path}\n@@\n-old\n+new\n*** End Patch`;
    expect(inspectRepositoryPatch(patch,manifest)).toEqual([path]);
    expect(()=>inspectRepositoryPatch(patch.replace(`Update File: ${path}`,`Update File: ${join(worktree,path)}`),manifest)).toThrow("repository_patch_outside_scope");
  });
  it("reads the real activation CLI as JSON without enabling the adapter",()=>{
    const code=`import assert from 'node:assert/strict';import {readRepositoryActivation,repositoryAdapterStatus} from './automation/agents/repository-cycle.mjs';
      const report=readRepositoryActivation({worktree:process.cwd()});
      assert.equal(report.schemaVersion,1);assert.equal(report.publicationAuthorized,false);assert.equal(report.publishSwitch,false);
      assert.ok(['NO-GO','READY_FOR_PROTECTED_CANDIDATE'].includes(report.decision));assert.equal(repositoryAdapterStatus().enabled,false);
      console.log('real-activation-parsed');`;
    expect(execFileSync(process.execPath,["--input-type=module","-e",code],{encoding:"utf8"})).toContain("real-activation-parsed");
  });
  it("does not enable repository execution",()=>expect(REPOSITORY_EXECUTION_ENABLED).toBe(false));
  it("CLI status does not launch work",()=>{
    const result=JSON.parse(execFileSync(process.execPath,["automation/agents/repository-cycle.mjs","status"],{encoding:"utf8"}));
    expect(result).toMatchObject({enabled:false,changesTrust:false,acquiresLease:false,productionValidated:false});
  });
  it("run API refuses before touching a supplied candidate or host",()=>{
    // Fixture setup has already finished. Neither disabled API may add any
    // worktree, claim, lease or other file during the attempted execution.
    const beforeFiles=readdirSync(root,{recursive:true}).sort();
    const beforeWorktrees=git(join(root,"control"),["worktree","list","--porcelain"]);
    const code=`import assert from 'node:assert/strict';import {runRepositoryRole,runRepositoryCandidate} from './automation/agents/repository-cycle.mjs';import {runBoundRole} from './automation/agents/isolated-transport.mjs';const trap=new Proxy({},{get(){throw Error('touched candidate')}});await assert.rejects(runRepositoryRole(trap,'builder','', {codex:'/never-run'}),/repository_execution_disabled/);await assert.rejects(runRepositoryCandidate(trap),/repository_execution_disabled/);await assert.rejects(runBoundRole(trap,'builder','',{mode:'repository'}),/repository_execution_disabled/);console.log('disabled-before-access');`;
    expect(execFileSync(process.execPath,["--input-type=module","-e",code],{encoding:"utf8"})).toContain("disabled-before-access");
    expect(readdirSync(root,{recursive:true}).sort()).toEqual(beforeFiles);
    expect(git(join(root,"control"),["worktree","list","--porcelain"])).toBe(beforeWorktrees);
  });
  it("hook denies despite attempted environment activation and does not echo input",()=>{
    const result=execFileSync(process.execPath,["automation/agents/repository-work.mjs"],{encoding:"utf8",input:"private-canary",
      env:{...process.env,REPOSITORY_EXECUTION_ENABLED:"true",OBRAXEN_ISOLATED_MODE:"repository"}});
    expect(JSON.parse(result).hookSpecificOutput.permissionDecision).toBe("deny");expect(result).not.toContain("private-canary");
  });
  it("CLI refuses run without reading a manifest",()=>{
    const result=spawnSync(process.execPath,["automation/agents/repository-cycle.mjs","run","/does-not-exist"],{encoding:"utf8"});
    expect(result.status).toBe(2);expect(result.stderr).toContain("repository_execution_disabled");
  });
  it("cannot disguise a repository candidate as fixture or replace its verifier",()=>{
    const code=`import assert from 'node:assert/strict';import {runBoundRole} from './automation/agents/isolated-transport.mjs';await assert.rejects(runBoundRole({manifest:{scope:'repository'}},'builder','',{mode:'fixture',verify:()=>true}),/isolated_scope_mismatch/);await assert.rejects(runBoundRole({manifest:{scope:'fixture'}},'builder','',{mode:'fixture',verify:()=>true}),/fixture_only/);console.log('no-scope-bypass');`;
    expect(execFileSync(process.execPath,["--input-type=module","-e",code],{encoding:"utf8"})).toContain("no-scope-bypass");
  });
  it("derives both deadline timestamps from one instant",()=>{
    const code=`import assert from 'node:assert/strict';import {repositoryDeadline} from './automation/agents/repository-cycle.mjs';const d=repositoryDeadline(1788870000999,1800);assert.equal(Date.parse(d.expiresAt)-Date.parse(d.createdAt),1800000);console.log('deadline-exact');`;
    expect(execFileSync(process.execPath,["--input-type=module","-e",code],{encoding:"utf8"})).toContain("deadline-exact");
  });
  it("rejects a passed check before the final patch",()=>{
    const code=`import assert from 'node:assert/strict';import {assertChecksAfterLastPatch} from './automation/agents/isolated-transport.mjs';
      const m={worktree:'/candidate',commands:[{role:'builder',kind:'check',command:"'/node' '/check.mjs'"}]};
      const check={type:'commandExecution',command:m.commands[0].command,cwd:m.worktree,status:'completed',exitCode:0,observedStartOrder:1,observedEndOrder:2};
      const patch={type:'fileChange',status:'completed',observedStartOrder:3,observedEndOrder:4};
      assert.throws(()=>assertChecksAfterLastPatch([check,patch],m,'builder',true),/required_check_stale_after_patch/);
      assert.throws(()=>assertChecksAfterLastPatch([patch,{...check,observedEndOrder:5}],m,'builder',true),/required_check_stale_after_patch/);
      const fresh={...check,observedStartOrder:5,observedEndOrder:6};
      assertChecksAfterLastPatch([patch,fresh],m,'builder',true);
      assert.throws(()=>assertChecksAfterLastPatch([patch,{...fresh,exitCode:1}],m,'builder',true));
      assert.throws(()=>assertChecksAfterLastPatch([{...fresh,observedStartOrder:undefined}],m,'builder',true),/item_execution_order_missing/);
      console.log('ordered-checks');`;
    expect(execFileSync(process.execPath,["--input-type=module","-e",code],{encoding:"utf8"})).toContain("ordered-checks");
  });
});

describe("repository identity and bound paths (temporary Git only)",()=>{
  it("rejects discovery and scout in the manually selected candidate adapter",()=>{
    expect(()=>validateRepositoryManifest({...manifest,phase:"discovery"},policy)).toThrow("invalid_repository_phase");
    expect(()=>validateRepositoryManifest({...manifest,commands:[...manifest.commands,{...manifest.commands[0],role:"scout"}]},policy)).toThrow("repository_command_role");
    expect(()=>evaluateRepositoryTool({},"scout",{...manifest,phase:"discovery"},()=>true)).toThrow("repository_role_phase");
  });
  it("validates an actual related worktree and bracketed Next.js path",()=>{
    expect(validateRepositoryManifest(manifest,policy)).toBe(manifest);
    expect(repositoryPath(worktree,path)).toBe(join(worktree,path));
  });
  it.each(["../escape","src//bad","/absolute","src/*","src/./bad"])("rejects unsafe path %s",p=>expect(()=>repositoryPath(worktree,p,true)).toThrow());
  it("rejects symlinks including dangling links",()=>{
    symlinkSync(join(root,"absent"),join(worktree,"dangling"));
    expect(()=>repositoryPath(worktree,"dangling",true)).toThrow("repository_symlink");
  });
  it("does not accept an unrelated control checkout",()=>expect(()=>validateRepositoryManifest({...manifest,controlRoot:worktree},policy)).toThrow());
  it("does not redirect coordination to another state home",()=>expect(()=>validateRepositoryManifest({...manifest,stateHome:manifest.evidenceRoot},policy)).toThrow("repository_shared_state_mismatch"));
  it("refuses a fixture manifest or maintenance classification",()=>{
    expect(()=>validateRepositoryManifest({...manifest,scope:"fixture"},policy)).toThrow("repository_manifest_required");
    expect(()=>validateRepositoryManifest({...manifest,attentionClass:"agent_maintenance"},policy)).toThrow("protected_maintenance_not_eligible");
  });
  it("blocks protected paths and mutable checks",()=>{
    expect(()=>validateRepositoryManifest({...manifest,allowedPaths:["AGENTS.md"]},policy)).toThrow("repository_protected_or_disabled_paths");
    const m=structuredClone(manifest);m.commands[0].digest="d".repeat(64);
    expect(()=>validateRepositoryManifest(m,policy)).toThrow("repository_check_changed");
  });
  it("blocks changed candidate integrity",()=>{
    const m=structuredClone(manifest);m.candidateIntegrity["package.json"]="e".repeat(64);
    expect(()=>validateRepositoryManifest(m,policy)).toThrow("repository_candidate_integrity_changed");
  });
  it("requires complete scout evidence and matching acceptance checks",()=>{
    expect(()=>validateRepositoryManifest({...manifest,scoutEvidence:null},policy)).toThrow();
    expect(()=>validateRepositoryManifest({...manifest,acceptanceChecks:[]},policy)).toThrow("repository_acceptance_checks_missing");
    expect(()=>validateRepositoryManifest({...manifest,acceptanceChecks:["other"]},policy)).toThrow("repository_acceptance_checks_mismatch");
  });
});

describe("fresh coordination observation",()=>{
  it("accepts only the owning claim and lease",()=>expect(assertRepositorySnapshot(manifest,snapshot())).toBe(true));
  it.each(["unreadable_worktrees","legacy_writer_lease_exists","pending_local_diff_limit","active_claim_paths_unknown"])("rejects new blocker %s",blocker=>{
    const s=snapshot();s.blockers.push(blocker);expect(()=>assertRepositorySnapshot(manifest,s)).toThrow("repository_preflight_blocked");
  });
  it("rejects foreign claims, lease mismatch, stale base and expiration",()=>{
    const s=snapshot();s.activeClaims.push({threadId:"other",files:[path]});expect(()=>assertRepositorySnapshot(manifest,s)).toThrow("repository_other_claims");
    const l=snapshot();l.lease.token="other";expect(()=>assertRepositorySnapshot(manifest,l)).toThrow("repository_lease_mismatch");
    expect(()=>assertRepositorySnapshot(manifest,{...snapshot(),baseSha:"0".repeat(40)})).toThrow("repository_runtime_or_base_changed");
    expect(()=>assertRepositorySnapshot(manifest,snapshot(),Date.parse(manifest.expiresAt)+1)).toThrow("repository_manifest_expired");
  });
});

describe("repository tool contract (no actual tool execution)",()=>{
  const patch=()=>`*** Begin Patch\n*** Update File: ${path}\n@@\n-pending\n+verified\n*** End Patch`;
  it("allows the exact builder patch including route brackets",()=>{
    expect(inspectRepositoryPatch(patch(),manifest)).toEqual([path]);
    expect(evaluateRepositoryTool({tool_name:"apply_patch",tool_input:{command:patch()}},"builder",manifest,()=>true)).toBe(true);
  });
  it("denies reviewer edits, path expansion, deletion and movement",()=>{
    expect(()=>evaluateRepositoryTool({tool_name:"apply_patch",tool_input:patch()},"auditor",{...manifest,phase:"review"},()=>true)).toThrow("repository_read_only_role");
    for(const p of [patch().replace(path,"elsewhere"),patch().replace("Update File","Delete File"),patch().replace("@@","*** Move to: elsewhere\n@@")])
      expect(()=>inspectRepositoryPatch(p,manifest)).toThrow();
    expect(()=>inspectRepositoryPatch(patch().replace("Update File","Add File"),manifest)).toThrow("repository_add_not_supported");
  });
  it("denies arbitrary shell, external tools and escalation",()=>{
    for(const input of [{tool_name:"Bash",tool_input:{command:"git push"}},{tool_name:"mcp__external",tool_input:{}},
      {tool_name:"exec_command",tool_input:{cmd:manifest.commands[1].command,sandbox_permissions:"require_escalated"}}])
      expect(()=>evaluateRepositoryTool(input,"builder",manifest,()=>true)).toThrow();
  });
});
