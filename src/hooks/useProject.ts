"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Define a simple type for our project
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
        // 1. Fetch user's projects from the API
        const response = await fetch("/api/projects");
        if (!response.ok) {
          throw new Error("Failed to fetch projects");
        }
        const projects: Project[] = await response.json();

        // 2. If user has no projects, redirect
        if (projects.length === 0) {
          router.push("/projects");
          return;
        }

        // 3. Check localStorage for a selected project
        const storedProjectId = localStorage.getItem("selectedProjectId");
        const isValidStoredId =
          storedProjectId &&
          projects.some((p) => p.id === storedProjectId);

        if (isValidStoredId) {
          // 4. If stored ID is valid, use it
          setProjectId(storedProjectId);
        } else {
          // 5. Otherwise, use the first project as default
          const defaultProjectId = projects[0].id;
          localStorage.setItem("selectedProjectId", defaultProjectId);
          setProjectId(defaultProjectId);
        }
      } catch (error) {
        console.error("Error in useProject hook:", error);
        // Optional: handle error state, e.g., redirect to an error page
        // or a generic "no projects" page
        router.push("/projects");
      }
    };

    fetchAndSetProject();
  }, [router]);

  return { projectId };
}