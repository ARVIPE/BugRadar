// [New File: src/hooks/useProject.ts]
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function useProject() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // This code only runs on the client
    const storedProjectId = localStorage.getItem("selectedProjectId");

    if (storedProjectId) {
      setProjectId(storedProjectId);
    } else {
      // If no project is selected, force redirect to project selection
      router.push("/projects");
    }
  }, [router]);

  return { projectId };
}