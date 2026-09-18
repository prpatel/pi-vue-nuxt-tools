import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "@sinclair/typebox";

type NuxtWorkflowStage = "analyze" | "architect" | "develop" | "test" | "review" | "fix" | "verify" | "done";

interface NuxtWorkflow {
  active: boolean;
  stage: NuxtWorkflowStage;
  spec: string;
  iteration: number;
  maxIterations: number;
  testsPassed: boolean;
  reviewIssues: string[];
  contextCompacted: boolean;
  pendingCompaction: boolean;
}

const STAGE_DESCRIPTIONS: Record<NuxtWorkflowStage, string> = {
  "analyze": "📋 Analyzing Spec",
  "architect": "🏗️ Architecting Nuxt 4.5.2 App",
  "develop": "💻 Writing Vue 3.5.43 Components",
  "test": "🧪 Running Vitest",
  "review": "🔍 Code Review (Clean Context)",
  "fix": "🔧 Fixing Issues",
  "verify": "✅ Final Verification",
  "done": "🎉 Complete",
};

export default function (pi: ExtensionAPI) {
  let workflow: NuxtWorkflow | null = null;

  pi.on("session_start", async (_event, ctx) => {
    workflow = null;
    for (const entry of ctx.sessionManager.getBranch()) {
      if (entry.type === "custom" && entry.customType === "nuxt-workflow-state") {
        workflow = entry.data as NuxtWorkflow;
      }
    }
    if (workflow?.active) updateStatus(ctx);
  });

  const updateStatus = (ctx: any) => {
    if (workflow?.active) {
      const desc = STAGE_DESCRIPTIONS[workflow.stage];
      ctx.ui.setStatus("nuxt-workflow", `${desc} (${workflow.iteration}/${workflow.maxIterations})`);
      pi.appendEntry("nuxt-workflow-state", workflow);
    } else {
      ctx.ui.setStatus("nuxt-workflow", undefined);
    }
  };

  pi.registerCommand("nuxt-workflow", {
    description: "Start the full Nuxt 4.5.2 / Vue 3.5.43 lifecycle workflow.",
    handler: async (args, ctx) => {
      let spec = args || "";
      if (spec.endsWith(".md") || spec.endsWith(".txt")) {
        const fs = await import("node:fs/promises");
        spec = await fs.readFile(spec, "utf-8");
      }
      
      if (!spec) {
        spec = await ctx.ui.editor("Enter spec:", "# Feature\n\nCreate a Nuxt app...");
        if (!spec) return;
      }

      workflow = {
        active: true, stage: "analyze", spec, iteration: 0,
        maxIterations: 15, testsPassed: false, reviewIssues: [], contextCompacted: false, pendingCompaction: false,
      };

      updateStatus(ctx);
      pi.sendMessage({
        customType: "nuxt-workflow",
        content: `🚀 **Nuxt/Vue Workflow Started**\n\n**Spec:**\n\`\`\`\n${spec}\n\`\`\`\n\n**Stage 1: ${STAGE_DESCRIPTIONS["analyze"]}**`,
        display: true,
      });

      pi.sendUserMessage(
        "You are the 'spec-analyst'. Read this spec and break it down into: 1) Functional requirements, 2) Data models/Stores, 3) Routes and Components. Call nuxt_workflow_next to proceed.",
        { deliverAs: "followUp" }
      );
    },
  });

  pi.registerTool({
    name: "nuxt_workflow_next",
    label: "Next Workflow Stage",
    description: "Move to the next stage of the Nuxt workflow.",
    parameters: Type.Object({ notes: Type.Optional(Type.String()) }),
    async execute(_id, params, _sig, _onUpd, ctx) {
      if (!workflow?.active) return { content: [{ type: "text", text: "❌ No active workflow" }], details: {} };
      workflow.iteration++;

      if (workflow.iteration >= workflow.maxIterations) {
        workflow.active = false;
        updateStatus(ctx);
        return { content: [{ type: "text", text: "⚠️ Max iterations reached." }], details: {} };
      }

      let nextStage: NuxtWorkflowStage;
      let message: string;
      let nextPrompt: string | null = null;

      switch (workflow.stage) {
        case "analyze":
          nextStage = "architect";
          message = "✅ Spec analyzed!\n\n**Stage 2: Architecting**";
          nextPrompt = "You are the 'nuxt-architect'. Scaffold the Nuxt 4.5.2 project using the bash tool (`npx nuxi@latest init . --force`). Configure `nuxt.config.ts` (the `app/` directory structure is the Nuxt 4 default; no `compatibilityVersion` flag needed) and install Nuxt UI 4.11.1. Call nuxt_workflow_next when done.";
          break;
        case "architect":
          nextStage = "develop";
          message = "✅ Project scaffolded!\n\n**Stage 3: Writing Implementation**";
          nextPrompt = "You are the 'vue-developer'. Implement the Vue 3.5.43 components, Nuxt 4.5.2 pages in the `app/` directory, and Pinia stores/composables. Use Nuxt UI components. Call nuxt_workflow_next when done.";
          break;
        case "develop":
          nextStage = "test";
          message = "✅ Implementation done!\n\n**Stage 4: Running Tests**";
          nextPrompt = "You are the 'vue-qa-engineer'. Write Vitest and @nuxt/test-utils tests. Run them using the `vue_test_runner` tool and report the exit code with nuxt_workflow_test_result.";
          break;
        case "test":
          if (workflow.testsPassed) {
            nextStage = "review";
            message = "✅ Tests passed!\n\n**Stage 5: Code Review**";
            // Flag compaction for before_agent_start. Calling ctx.compact() from
            // a tool is unsafe — its internal abort() → waitForIdle() deadlocks
            // because the agent can't become idle while the tool is still executing.
            workflow.pendingCompaction = true;
            nextPrompt = "You are the 'vue-reviewer'. Review code for: Vue 3.5.43 reactivity issues, Nuxt 4.5.2 SSR leaks, proper Nuxt UI usage, and edge cases. Call nuxt_workflow_review_result.";
          } else {
            nextStage = "fix";
            message = "❌ Tests failed!\n\n**Stage 6: Fixing Issues**";
            nextPrompt = "You are the 'vue-developer'. Fix the Vitest failures. Call nuxt_workflow_next to re-test.";
          }
          break;
        case "fix":
          nextStage = "test";
          message = "🔧 Fixes applied!\n\n**Stage 4: Re-testing**";
          nextPrompt = "You are the 'vue-qa-engineer'. Re-run tests with `vue_test_runner`. Call nuxt_workflow_test_result.";
          break;
        case "review":
          if (workflow.reviewIssues.length === 0) {
            nextStage = "verify";
            message = "✅ Review passed!\n\n**Stage 7: Final Verification**";
            nextPrompt = "Run the full Vitest suite one final time. Then call nuxt_workflow_complete.";
          } else {
            nextStage = "fix";
            message = `📋 Review found ${workflow.reviewIssues.length} issues\n\n**Stage 6: Fixing Issues**`;
            nextPrompt = `You are the 'vue-developer'. Fix these review issues:\n${workflow.reviewIssues.join("\n")}\n\nCall nuxt_workflow_next to re-test.`;
          }
          break;
        case "verify":
          nextStage = "done";
          workflow.active = false;
          message = "🎉 **Workflow Complete!**";
          break;
        default:
          nextStage = "done";
          message = "✅ Complete";
      }

      workflow.stage = nextStage;
      workflow.contextCompacted = false;
      updateStatus(ctx);
      if (nextPrompt) pi.sendUserMessage(nextPrompt, { deliverAs: "followUp" });

      return { content: [{ type: "text", text: message }], details: { workflow } };
    },
  });

  pi.registerTool({
    name: "nuxt_workflow_test_result",
    label: "Report Test Result",
    description: "Report test execution result with exit code.",
    parameters: Type.Object({ exitCode: Type.Number(), output: Type.Optional(Type.String()) }),
    async execute(_id, params, _sig, _onUpd, ctx) {
      if (!workflow) return { content: [], details: {} };
      workflow.testsPassed = params.exitCode === 0;
      updateStatus(ctx);
      pi.sendUserMessage("Call nuxt_workflow_next to progress.", { deliverAs: "followUp" });
      return { content: [{ type: "text", text: `Test exit code: ${params.exitCode}` }], details: {} };
    },
  });

  pi.registerTool({
    name: "nuxt_workflow_review_result",
    label: "Report Review Result",
    description: "Report code review findings.",
    parameters: Type.Object({ issues: Type.Array(Type.String()) }),
    async execute(_id, params, _sig, _onUpd, ctx) {
      if (!workflow) return { content: [], details: {} };
      workflow.reviewIssues = params.issues;
      updateStatus(ctx);
      pi.sendUserMessage("Call nuxt_workflow_next to progress.", { deliverAs: "followUp" });
      return { content: [{ type: "text", text: `Reported ${params.issues.length} issues.` }], details: {} };
    },
  });

  pi.registerTool({
    name: "nuxt_workflow_complete",
    label: "Complete Workflow",
    description: "Mark workflow as complete.",
    parameters: Type.Object({ summary: Type.String() }),
    async execute(_id, params, _sig, _onUpd, ctx) {
      if (!workflow) return { content: [], details: {} };
      workflow.stage = "done";
      workflow.active = false;
      updateStatus(ctx);
      return { content: [{ type: "text", text: "Workflow complete!" }], details: {} };
    },
  });

  pi.on("before_agent_start", async (_event, ctx) => {
    if (!workflow?.active) return {};

    // Handle pending compaction that was flagged from a tool.
    // ctx.compact() is safe here because before_agent_start runs before
    // the agent loop begins — no tool is executing, so abort()/waitForIdle()
    // won't deadlock.
    if (workflow.pendingCompaction && !workflow.contextCompacted) {
      workflow.pendingCompaction = false;
      ctx.compact({
        customInstructions: "Keep only: 1) Original spec, 2) List of files created/modified, 3) Brief implementation summary. Remove conversation history for unbiased review.",
        onComplete: () => {
          if (workflow) {
            workflow.contextCompacted = true;
            updateStatus(ctx);
          }
        },
        onError: (error) => {
          ctx.ui?.notify?.(`Compaction failed: ${error.message}`, "error");
        },
      });
    }

    const guidance = `\n---\n**🔄 NUXT WORKFLOW ACTIVE**\nStage: ${workflow.stage}\nContext: ${workflow.contextCompacted ? "COMPACTED (Clean Review)" : "Full"}\n---`;
    return { systemPrompt: _event.systemPrompt + guidance };
  });
}