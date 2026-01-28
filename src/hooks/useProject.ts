"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
}

export function useProject() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchAndSetProject = async () => {
      try {
        const response = await fetch("/api/projects");
        if (!response.ok) {
          throw new Error("Failed to fetch projects");
        }
        const projects: Project[] = await response.json();

        // If user has no projects, redirect
        if (projects.length === 0) {
          router.push("/projects");
          return;
        }

        // Check localStorage for a selected project
        const storedProjectId = localStorage.getItem("selectedProjectId");
        const isValidStoredId =
          storedProjectId &&
          projects.some((p) => p.id === storedProjectId);

        if (isValidStoredId) {
          // If stored ID is valid, use it
          setProjectId(storedProjectId);
        } else {
          // Otherwise, use the first project as default
          const defaultProjectId = projects[0].id;
          localStorage.setItem("selectedProjectId", defaultProjectId);
          setProjectId(defaultProjectId);
        }
      } catch (error) {
        console.error("Error in useProject hook:", error);
        router.push("/projects");
      }
    };

    fetchAndSetProject();
  }, [router]);

  return { projectId };
}