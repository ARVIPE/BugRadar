import { NextResponse } from "next/server";
import { zipSync, strToU8 } from "fflate";
import fs from "fs";
import path from "path";

export async function GET() {
  const agentDir = path.join(process.cwd(), "agent");

  const files: Record<string, string> = {
    "agent.py": fs.readFileSync(path.join(agentDir, "agent.py"), "utf-8"),
    Dockerfile: fs.readFileSync(path.join(agentDir, "Dockerfile"), "utf-8"),
    "requirements.txt": fs.readFileSync(
      path.join(agentDir, "requirements.txt"),
      "utf-8",
    ),
  };

  const zipInput: Record<string, Uint8Array> = {};
  for (const [name, content] of Object.entries(files)) {
    zipInput[name] = strToU8(content);
  }

  const zipped = zipSync(zipInput, { level: 6 });

  const buffer = Buffer.from(zipped);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="bugradar-agent.zip"',
    },
  });
}
