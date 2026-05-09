"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function getOptionalValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function buildProjectRedirect(slug: string | null, params: Record<string, string>) {
  const basePath = slug ? `/projects/${slug}` : "/projects";
  const searchParams = new URLSearchParams(params);
  return `${basePath}?${searchParams.toString()}#application-form`;
}

export async function submitProjectApplication(formData: FormData) {
  const supabase = await createClient();
  const projectId = String(formData.get("project_id") ?? "").trim();
  const projectSlug = String(formData.get("project_slug") ?? "").trim();
  const applicantName = String(formData.get("applicant_name") ?? "").trim();
  const contactWechat = getOptionalValue(formData, "contact_wechat");
  const contactPhone = getOptionalValue(formData, "contact_phone");
  const contactEmail = getOptionalValue(formData, "contact_email");

  if (!projectId || !applicantName) {
    redirect(buildProjectRedirect(projectSlug, { error: "missing_required_fields" }));
  }

  if (!contactWechat && !contactPhone && !contactEmail) {
    redirect(buildProjectRedirect(projectSlug, { error: "missing_contact_channel" }));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: project, error: projectError } = await supabase
    .from("project_opportunities")
    .select("id, slug, status")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !project) {
    redirect(buildProjectRedirect(projectSlug, { error: "project_not_found" }));
  }

  if (project.status !== "recruiting") {
    redirect(buildProjectRedirect(project.slug, { error: "applications_closed" }));
  }

  const { error } = await supabase.from("project_applications").insert({
    project_id: projectId,
    applicant_user_id: user?.id ?? null,
    applicant_name: applicantName,
    contact_wechat: contactWechat,
    contact_phone: contactPhone,
    contact_email: contactEmail,
    role_interest: getOptionalValue(formData, "role_interest"),
    available_time: getOptionalValue(formData, "available_time"),
    experience_summary: getOptionalValue(formData, "experience_summary"),
    portfolio_url: getOptionalValue(formData, "portfolio_url"),
    note: getOptionalValue(formData, "note"),
  });

  if (error) {
    redirect(buildProjectRedirect(project.slug, { error: "submit_failed" }));
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${project.slug}`);
  redirect(buildProjectRedirect(project.slug, { applied: "1" }));
}
