"use client";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import {
  Loader2,
  Plus,
  AlertTriangle,
  Copy,
  Check,
  Trash2, // 1. Importar el icono de basura
} from "lucide-react";

interface Project {
  id: string;
  name: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null); // 2. Estado para el spinner de borrado
  const [error, setError] = useState<string | null>(null);
  const [newProjectKey, setNewProjectKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const router = useRouter();

  // Cargar proyectos al iniciar
  useEffect(() => {
    fetch("/api/projects")
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            "No se pudieron cargar los proyectos. ¿Has iniciado sesión?"
          );
        }
        return res.json();
      })
      .then((data) => {
        setProjects(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Crear un nuevo proyecto
  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;

    setIsCreating(true);
    setNewProjectKey(null);
    setCopied(false);
    setError(null); // Limpiar errores

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newProjectName }),
    });

    if (res.ok) {
      const newProject = await res.json();
      setProjects([newProject, ...projects]);
      setNewProjectKey(newProject.apiKey);
      setNewProjectName("");
    } else {
      const errData = await res.json();
      setError(`Error al crear: ${errData.error || res.statusText}`);
    }
    setIsCreating(false);
  };

  // Seleccionar un proyecto e ir al Dashboard
  const selectProject = (projectId: string) => {
    localStorage.setItem("selectedProjectId", projectId);
    router.push("/dashboard");
  };

  // 3. Función para Borrar un proyecto
  const handleDeleteProject = async (projectId: string, projectName: string) => {
    // Usamos prompt para una confirmación segura (ya que no podemos usar alert/confirm)
    const confirmation = prompt(
      `Esto borrará permanentemente el proyecto y TODOS sus logs.\n\nPara confirmar, escribe el nombre del proyecto: "${projectName}"`
    );

    if (confirmation !== projectName) {
      setError(
        "El nombre no coincide. El proyecto NO se ha borrado."
      );
      setTimeout(() => setError(null), 3000); // Limpiar error
      return;
    }

    setDeletingId(projectId);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "No se pudo borrar el proyecto");
      }

      // Quitar el proyecto de la lista en el frontend
      setProjects((currentProjects) =>
        currentProjects.filter((p) => p.id !== projectId)
      );
    } catch (err: any) {
      setError(`Error al borrar: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Copiar la API key
  const handleCopyKey = () => {
    if (newProjectKey) {
      navigator.clipboard.writeText(newProjectKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // --- Sub-componentes de Renderizado ---

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="w-12 h-12 animate-spin text-skin-subtitle" />
      <p className="mt-4 text-skin-subtitle">Cargando tus proyectos...</p>
    </div>
  );

  const renderContent = () => {
    if (isLoading) return renderLoading();

    return (
      <>
        {/* Bloque de Error (si existe) */}
        {error && (
          <div className="mb-4 bg-destructive/10 border border-destructive/50 text-destructive p-3 rounded-md flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Bloque de Éxito al Crear (si existe) */}
        {newProjectKey && (
          <div className="mb-8 bg-emerald-100 border-l-4 border-emerald-500 text-emerald-900 p-4 rounded-md shadow-lg">
            <h3 className="font-bold text-lg">¡Proyecto Creado con Éxito!</h3>
            <p className="text-sm mt-1">
              Guarda esta API Key. La necesitarás para configurar tu agente.
            </p>
            <div className="mt-4 flex bg-emerald-50 p-2 rounded border border-emerald-200">
              <input
                type="text"
                readOnly
                value={newProjectKey}
                className="flex-1 bg-transparent text-sm text-emerald-800 font-mono focus:outline-none"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyKey}
                className="text-emerald-700 hover:text-emerald-900"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Lista de Proyectos */}
        <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-6">
          <h2 className="text-xl font-semibold text-skin-title mb-4">
            Selecciona un Proyecto
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
                    disabled={!!deletingId} // Desactivar si se está borrando algo
                  >
                    {project.name}
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleDeleteProject(project.id, project.name)
                    }
                    disabled={!!deletingId} // Desactivar todos los botones de borrado
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
                No tienes ningún proyecto todavía. ¡Crea uno!
              </p>
            )}
          </div>
        </div>

        {/* Formulario de Creación */}
        <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-6 mt-8">
          <h2 className="text-xl font-semibold text-skin-title mb-4">
            O crea uno nuevo
          </h2>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <Input
              placeholder="Nombre de tu nueva app..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="bg-skin-input border-border focus:ring-[var(--ring)]"
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
              {isCreating ? "Creando..." : "Crear Proyecto"}
            </Button>
          </form>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen w-full bg-skin-bg text-skin-title">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-10">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
}