"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

type ProjectApplicationDuplicateCandidate = {
  id: string;
  applicant_user_id: string | null;
  contact_wechat: string | null;
  contact_phone: string | null;
  contact_email: string | null;
};

function normalizeContactValue(value: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function normalizePhoneValue(value: string | null) {
  return (value ?? "").replace(/\D/g, "");
}

function isDuplicateApplication(
  application: ProjectApplicationDuplicateCandidate,
  {
    applicantUserId,
    contactWechat,
    contactPhone,
    contactEmail,
  }: {
    applicantUserId: string | null;
    contactWechat: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
  },
) {
  if (applicantUserId && application.applicant_user_id === applicantUserId) {
    return true;
  }

  if (
    contactWechat &&
    normalizeContactValue(application.contact_wechat) === normalizeContactValue(contactWechat)
  ) {
    return true;
  }

  if (
    contactEmail &&
    normalizeContactValue(application.contact_email) === normalizeContactValue(contactEmail)
  ) {
    return true;
  }

  const normalizedPhone = normalizePhoneValue(contactPhone);

  return Boolean(
    normalizedPhone &&
      normalizePhoneValue(application.contact_phone) === normalizedPhone,
  );
}

async function hasExistingProjectApplication({
  projectId,
  applicantUserId,
  contactWechat,
  contactPhone,
  contactEmail,
}: {
  projectId: string;
  applicantUserId: string | null;
  contactWechat: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
}) {
  const adminSupabase = createSupabaseAdminClient();

  if (!adminSupabase) {
    return false;
  }

  const { data, error } = await adminSupabase
    .from("project_applications")
    .select("id, applicant_user_id, contact_wechat, contact_phone, contact_email")
    .eq("project_id", projectId);

  if (error) {
    console.error("Failed to check duplicate project application.", {
      projectId,
      error,
    });
    return false;
  }

  return ((data ?? []) as ProjectApplicationDuplicateCandidate[]).some((application) =>
    isDuplicateApplication(application, {
      applicantUserId,
      contactWechat,
      contactPhone,
      contactEmail,
    }),
  );
}

function isUniqueViolation(error: { code?: string } | null) {
  return error?.code === "23505";
}

export async function submitProjectApplication(formData: FormData) {
  const supabase = await createClient();
  const projectId = String(formData.get("project_id") ?? "").trim();
  const projectSlug = String(formData.get("project_slug") ?? "").trim();
  const applicantName = String(formData.get("applicant_name") ?? "").trim();
  const applicantOccupation = getOptionalValue(formData, "applicant_occupation");
  const contactWechat = getOptionalValue(formData, "contact_wechat");
  const contactPhone = getOptionalValue(formData, "contact_phone");
  const contactEmail = getOptionalValue(formData, "contact_email");
  const submissionKey = getOptionalValue(formData, "submission_key");

  if (!projectId || !applicantName || !applicantOccupation) {
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
    .select("id, slug, status, application_requires_login")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !project) {
    redirect(buildProjectRedirect(projectSlug, { error: "project_not_found" }));
  }

  if (project.status !== "recruiting") {
    redirect(buildProjectRedirect(project.slug, { error: "applications_closed" }));
  }

  if (project.application_requires_login && !user) {
    redirect(`/login?next=${encodeURIComponent(`/projects/${project.slug}#application-form`)}`);
  }

  const applicantUserId = user?.id ?? null;
  const hasExistingApplication = await hasExistingProjectApplication({
    projectId,
    applicantUserId,
    contactWechat,
    contactPhone,
    contactEmail,
  });

  if (hasExistingApplication) {
    redirect(buildProjectRedirect(project.slug, { applied: "1" }));
  }

  const { error } = await supabase.from("project_applications").insert({
    project_id: projectId,
    applicant_user_id: applicantUserId,
    applicant_name: applicantName,
    applicant_occupation: applicantOccupation,
    contact_wechat: contactWechat,
    contact_phone: contactPhone,
    contact_email: contactEmail,
    role_interest: getOptionalValue(formData, "role_interest"),
    available_time: getOptionalValue(formData, "available_time"),
    experience_summary: getOptionalValue(formData, "experience_summary"),
    portfolio_url: getOptionalValue(formData, "portfolio_url"),
    note: getOptionalValue(formData, "note"),
    submission_key: submissionKey,
  });

  if (error) {
    if (isUniqueViolation(error)) {
      redirect(buildProjectRedirect(project.slug, { applied: "1" }));
    }

    redirect(buildProjectRedirect(project.slug, { error: "submit_failed" }));
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${project.slug}`);
  redirect(buildProjectRedirect(project.slug, { applied: "1" }));
}
