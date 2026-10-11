"use client";
import { createProject, updateProject } from "@/services/projectsApi";
import type { Project, CreateProjectInput } from "@/types/project";
import { validateProject } from "@/lib/projectRules";
import { Editor, type Field } from "./ProjectUI";
import { useProjectManagers } from "./useProjectManagers";
export default function ProjectForm({
  project,
  onClose,
  onSaved,
}: {
  project?: Project;
  onClose: () => void;
  onSaved: (project: Project) => void;
}) {
  const managers = useProjectManagers(!project);
  const fields: Field[] = [
    { name: "projectName", label: "Project name", required: true },
    { name: "location", label: "Location" },
    { name: "startDate", label: "Start date", type: "date", required: true },
    { name: "endDate", label: "End date", type: "date" },
    {
      name: "budget",
      label: "Project budget (LKR)",
      type: "number",
      min: 0,
      step: "0.01",
    },
    ...(!project ? [managers.field] : []),
  ];
  const input = (v: Record<string, string>): CreateProjectInput => ({
    projectName: (v.projectName ?? "").trim(),
    location: v.location?.trim(),
    startDate: v.startDate,
    endDate: v.endDate || undefined,
    budget: v.budget ? Number(v.budget) : undefined,
    projectManagerId: v.projectManagerId?.trim() ?? "",
  });
  return (
    <Editor
      title={project ? "Edit project" : "Create project"}
      fields={fields}
      onClose={onClose}
      description={
        project
          ? "Update the project schedule and budget. Manager assignment is managed separately."
          : "New projects begin in Planning. Link an approved quotation before activating the project."
      }
      initial={
        project
          ? {
              projectName: project.projectName,
              location: project.location ?? "",
              startDate: project.startDate.slice(0, 10),
              endDate: project.endDate?.slice(0, 10) ?? "",
              budget: project.budget?.toString() ?? "",
            }
          : {}
      }
      validate={(v) => validateProject(input(v), !project)}
      submitLabel={project ? "Save changes" : "Create project"}
      onSave={async (v) => {
        const payload = input(v);
        const updated = project
          ? await updateProject(project.id, {
              projectName: payload.projectName,
              location: payload.location,
              startDate: payload.startDate,
              endDate: payload.endDate ?? null,
              budget: payload.budget ?? null,
            })
          : await createProject(payload);
        onSaved(updated);
      }}
    />
  );
}
