import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "vue_test_runner",
    label: "Run Vitest",
    description: "Run Vitest tests and return exit code and output.",
    parameters: Type.Object({
      testFile: Type.Optional(Type.String({ description: "Specific test file to run" }))
    }),
    async execute(_id, params, _signal, onUpdate, ctx) {
      const target = params.testFile || "";
      const cmd = `npx vitest run ${target}`;
      
      onUpdate?.({ content: [{ type: "text", text: `Running: ${cmd}...` }] });
      
      try {
        const { stdout, stderr } = await execAsync(cmd, { cwd: ctx.cwd });
        return {
          content: [{ type: "text", text: `Tests Passed!\n\n${stdout}` }],
          details: { exitCode: 0 }
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Tests Failed!\n\nSTDOUT:\n${error.stdout}\n\nSTDERR:\n${error.stderr}` }],
          details: { exitCode: error.code || 1 }
        };
      }
    },
  });
}