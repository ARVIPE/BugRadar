"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import {
  Loader2,
  Plus,
  AlertTriangle,
  Copy,
  Check,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface Project {
  id: string;
  name: string;
  apiKey?: string;
}

const BACKEND_URL = "http://host.docker.internal:3000";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "app";
}

export default function ProjectsClient() {
  const locale = useLocale();
  const t = useTranslations("Projects");
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  // --- 2. AÑADIR NUEVO ESTADO PARA ENDPOINTS ---
  const [newProjectEndpoints, setNewProjectEndpoints] = useState(""); 
  
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dockerCompose, setDockerCompose] = useState<string | null>(null);
  const [copiedCompose, setCopiedCompose] = useState(false);

  // Cargar proyectos existentes
  useEffect(() => {
    fetch("/api/projects")
      .then((res) => {
        if (!res.ok) {
          throw new Error(t("loadErrorAuth"));
        }
        return res.json();
      })
      .then((data) => {
        setProjects(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [t]);

  // Crear proyecto
  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsCreating(true);
    setDockerCompose(null);
    setCopiedCompose(false);
    setError(null);

    // --- 3. PREPARAR DATOS PARA LA API ---
    // Convertir el string del textarea en un array limpio
    const endpointsArray = newProjectEndpoints
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.includes(' ')); // Filtra líneas vacías o sin formato

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // --- 4. ENVIAR NOMBRE Y ENDPOINTS ---
      body: JSON.stringify({ 
        name: newProjectName,
        monitored_endpoints: endpointsArray // Enviar el array
      }),
    });

    if (res.ok) {
      const newProject: Project = await res.json();
      setProjects((prev) => [newProject, ...prev]);
      setNewProjectName("");
      setNewProjectEndpoints(""); // <-- Limpiar el textarea
      
      if (newProject.apiKey) {
        const slug = slugify(newProject.name || "app");

        // 👇 Compose actualizado (con BUGRADAR_CONFIG_URL y BUGRADAR_LATENCY_TARGET_URL)
        const compose = `
services:
  ${slug}:
    build:
      context: ./` + slug + `
    container_name: ${slug}
    ports:
      - "5000:5000"
    labels:
      - bugradar=true
    environment:
      APP_NAME: "${slug}"
    networks:
      - bugradar-net

  bugradar-agent:
    image: bugradar/agent:latest
    container_name: bugradar-agent
    restart: always
    environment:
      BUGRADAR_API_KEY: "${newProject.apiKey}"
      BUGRADAR_API_URL: "${BACKEND_URL}/api/logs"
      BUGRADAR_LATENCY_API_URL: "${BACKEND_URL}/api/latency"
      
      # --- URLs para el agente ---
      BUGRADAR_CONFIG_URL: "${BACKEND_URL}/api/config"
      BUGRADAR_LATENCY_TARGET_URL: "http://${slug}:5000"
      
      BUGRADAR_DISCOVER_BY_LABEL: "bugradar=true"
      BUGRADAR_CONTAINERS: "${slug}"
      BUGRADAR_TAIL: "100"
      BUGRADAR_PARSE_JSON: "1"
      PYTHONUNBUFFERED: "1"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - bugradar-net

networks:
  bugradar-net:
    driver: bridge
`;

        setDockerCompose(compose);
      }
    } else {
      const errData = await res.json();
      setError(t("createError", { message: errData.error || "" }).trim());
    }
    setIsCreating(false);
  };
  
  // ... (resto de funciones: handleCopyCompose, selectProject, handleDeleteProject) ...
  const handleCopyCompose = () => {
    if (dockerCompose) {
      navigator.clipboard.writeText(dockerCompose);
      setCopiedCompose(true);
      setTimeout(() => setCopiedCompose(false), 2000);
    }
  };

  const selectProject = (id: string) => {
    localStorage.setItem("selectedProjectId", id);
    router.push(`/${locale}/dashboard`);
  };

  const handleDeleteProject = async (id: string, name: string) => {
    const confirmation = prompt(t("deleteConfirmPrompt", { projectName: name }));
    if (confirmation !== name) {
      setError(t("deleteNameMismatch"));
      return;
    }
    setDeletingId(id);

    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(t("deleteErrorWithMsg", { message: err.message }));
    } finally {
      setDeletingId(null);
    }
  };


  // ... (Render)
  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-12 h-12 animate-spin text-skin-subtitle" />
        <p className="mt-4 text-skin-subtitle">{t("loadingProjects")}</p>
      </div>
    );
    
  return (
    <div className="min-h-screen w-full bg-skin-bg text-skin-title">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-10 space-y-8">
        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/50 text-destructive p-3 rounded-md flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* docker-compose generado */}
        {dockerCompose && (
          <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-5">
            <h3 className="font-semibold text-skin-title mb-2">
              docker-compose.yml generado
            </h3>
            <p className="text-sm text-skin-subtitle mb-3">
              Guarda este archivo junto a tu proyecto y ejecuta:
              <code className="ml-2">docker compose up -d</code>
            </p>
            <div className="relative">
              <textarea
                readOnly
                value={dockerCompose}
                className="w-full bg-skin-bg border border-border rounded-md p-3 font-mono text-xs leading-relaxed min-h-[260px]"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCompose}
                className="absolute top-2 right-2"
              >
                {copiedCompose ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Lista de proyectos */}
        <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-6">
          <h2 className="text-xl font-semibold text-skin-title mb-4">
            {t("selectProject")}
          </h2>
          <div className="space-y-3">
            {projects.length > 0 ? (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 bg-skin-bg border border-border rounded-md"
                >
                  <button
                    className="flex-1 text-left text-skin-title hover:underline font-medium"
                    onClick={() => selectProject(project.id)}
                    disabled={!!deletingId}
                  >
                    {project.name}
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleDeleteProject(project.id, project.name)
                    }
                    disabled={!!deletingId}
                    className="text-destructive hover:text-destructive/80"
                  >
                    {deletingId === project.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-skin-subtitle py-4">
                {t("noProjects")}
              </p>
            )}
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-6">
          <h2 className="text-xl font-semibold text-skin-title mb-4">
            {t("createNewTitle")}
          </h2>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <Input
              placeholder={t("createPlaceholder")}
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="bg-skin-input border-border focus:ring-[var(--ring)]"
            />
            
            {/* --- 5. AÑADIR TEXTAREA AL FORMULARIO --- */}
            <Textarea
              placeholder={t("endpointsPlaceholder", { example1: "GET /api/health", example2: "POST /api/login" })}
              value={newProjectEndpoints} 
              onChange={(e) => setNewProjectEndpoints(e.target.value)}
              className="bg-skin-input border-border focus:ring-[var(--ring)] font-mono text-sm min-h-[120px]"
            />
            
            <Button
              type="submit"
              disabled={isCreating || !newProjectName}
              className="w-full"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {isCreating ? t("creating") : t("createButton")}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}