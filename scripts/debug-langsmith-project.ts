#!/usr/bin/env node
import "dotenv/config";
import { Client } from "langsmith";

async function main() {
  const client = new Client();
  const projectName = process.env.LANGCHAIN_PROJECT;
  console.log("LANGCHAIN_PROJECT =", projectName);

  const projects: any[] = [];
  for await (const batch of client.listProjects()) {
    // listProjects yields pages (arrays) in this SDK
    if (Array.isArray(batch)) projects.push(...batch);
    else projects.push(batch);
  }

  console.log(`Found ${projects.length} project(s). First 10:`);
  for (const p of projects.slice(0, 10)) {
    console.log(`- ${p.name} (id=${p.id})`);
  }

  if (projectName) {
    try {
      const p = await client.readProject({ projectName });
      console.log(`\nreadProject(${projectName}) ok: id=${p.id}`);
    } catch (e) {
      console.log(`\nreadProject(${projectName}) failed:`, e);
    }
  }

  console.log("\nFirst 10 runs in project:");
  let i = 0;
  for await (const run of client.listRuns({ projectName: projectName ?? "default", limit: 10 })) {
    i++;
    // execution_order isn't in the TS type in older SDKs
    const anyRun = run as any;
    console.log(
      `#${i} id=${run.id} name=${run.name} type=${run.run_type} execution_order=${anyRun.execution_order} is_root=${anyRun.is_root} parent_run_id=${run.parent_run_id}`
    );
    if (run.name === "LangGraph") {
      const rr: any = await client.readRun(run.id);
      console.log(`  LangGraph child_run_ids: ${Array.isArray(rr.child_run_ids) ? rr.child_run_ids.length : "n/a"}`);
      console.log(`  LangGraph outputs keys: ${rr.outputs ? Object.keys(rr.outputs) : "none"}`);
    }
  }
  if (i === 0) {
    console.log("(no runs returned)");
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});

