"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAdminAuditLog } from "@/lib/admin/audit";
import { runWorkflowDeepSeekJob } from "@/lib/admin/workflow-ai";
import { requireAdminPermission } from "@/lib/supabase/guards";

const ADMIN_WORKFLOWS_PATH = "/admin/workflows";
const DONE_STEP_STATUSES = new Set(["approved", "done", "skipped"]);

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || null;
}

function getSafeRedirect(formData: FormData, fallback: string) {
  const redirectTo = getOptionalString(formData, "redirect_to");
  return redirectTo?.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : fallback;
}

function appendSearchParam(path: string, key: string, value: string) {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set(key, value);
  return `${pathname}?${params.toString()}`;
}

function addDays(value: string | null, days: number | null) {
  if (!value || days === null || days === undefined) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

async function loadWorkflowTemplate(
  supabase: Awaited<ReturnType<typeof requireAdminPermission>>["supabase"],
  templateId: string | null,
) {
  const query = supabase
    .from("workflow_templates")
    .select("id, template_key, name, kind")
    .eq("is_active", true);

  const { data, error } = templateId
    ? await query.eq("id", templateId).maybeSingle()
    : await query.eq("template_key", "event_full_cycle").maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as {
    id: string;
    template_key: string;
    name: string;
    kind: string;
  };
}

export async function createWorkflowRunAction(formData: FormData) {
  const context = await requireAdminPermission("workflows.write");
  const { supabase, user } = context;
  const template = await loadWorkflowTemplate(supabase, getOptionalString(formData, "template_id"));
  const relatedEventId = getOptionalString(formData, "related_event_id");
  const summary = getOptionalString(formData, "summary");
  let title = getString(formData, "title");
  let eventAt: string | null = null;

  if (!template) {
    redirect(appendSearchParam(ADMIN_WORKFLOWS_PATH, "error", "template_missing"));
  }

  if (relatedEventId) {
    const { data: event } = await supabase
      .from("events")
      .select("title, event_at")
      .eq("id", relatedEventId)
      .maybeSingle();

    title ||= event?.title ? `活动：${event.title}` : "";
    eventAt = event?.event_at ?? null;
  }

  if (!title) {
    redirect(appendSearchParam(ADMIN_WORKFLOWS_PATH, "error", "missing_title"));
  }

  const { data: run, error: runError } = await supabase
    .from("workflow_runs")
    .insert({
      template_id: template.id,
      title,
      summary,
      kind: template.kind,
      status: "active",
      priority: getString(formData, "priority") || "normal",
      owner_id: user.id,
      related_event_id: relatedEventId,
      starts_at: new Date().toISOString(),
      due_at: eventAt,
      created_by: user.id,
      metadata: {
        source: "admin",
        template_key: template.template_key,
      },
    })
    .select("id")
    .single();

  if (runError || !run?.id) {
    redirect(appendSearchParam(ADMIN_WORKFLOWS_PATH, "error", "run_create_failed"));
  }

  const { data: templateSteps, error: stepsError } = await supabase
    .from("workflow_template_steps")
    .select(
      "id, step_key, title, description, stage, default_due_offset_days, sort_order, ai_job_type, requires_review, metadata",
    )
    .eq("template_id", template.id)
    .order("sort_order", { ascending: true });

  if (stepsError || !templateSteps?.length) {
    redirect(appendSearchParam(`${ADMIN_WORKFLOWS_PATH}/${run.id}`, "error", "steps_missing"));
  }

  const { error: insertStepsError } = await supabase.from("workflow_steps").insert(
    templateSteps.map((step) => ({
      run_id: run.id,
      template_step_id: step.id,
      step_key: step.step_key,
      title: step.title,
      description: step.description,
      stage: step.stage,
      status: "todo",
      due_at: addDays(eventAt, step.default_due_offset_days),
      sort_order: step.sort_order,
      metadata: {
        ai_job_type: step.ai_job_type,
        requires_review: step.requires_review,
        template_metadata: step.metadata,
      },
    })),
  );

  if (insertStepsError) {
    redirect(appendSearchParam(`${ADMIN_WORKFLOWS_PATH}/${run.id}`, "error", "steps_create_failed"));
  }

  await recordAdminAuditLog(supabase, {
    actorId: user.id,
    action: "workflow.create",
    resourceType: "workflow_run",
    resourceId: run.id,
    afterSnapshot: {
      title,
      template_key: template.template_key,
      related_event_id: relatedEventId,
    },
  });

  revalidatePath(ADMIN_WORKFLOWS_PATH);
  redirect(appendSearchParam(`${ADMIN_WORKFLOWS_PATH}/${run.id}`, "saved", "workflow"));
}

export async function updateWorkflowStepStatusAction(formData: FormData) {
  const context = await requireAdminPermission("workflows.write");
  const { supabase, user } = context;
  const runId = getString(formData, "run_id");
  const stepId = getString(formData, "step_id");
  const status = getString(formData, "status");
  const redirectTo = getSafeRedirect(formData, `${ADMIN_WORKFLOWS_PATH}/${runId}`);

  if (!runId || !stepId || !status) {
    redirect(appendSearchParam(redirectTo, "error", "missing_step_status"));
  }

  const { error } = await supabase
    .from("workflow_steps")
    .update({
      status,
      completed_at: DONE_STEP_STATUSES.has(status) ? new Date().toISOString() : null,
    })
    .eq("id", stepId)
    .eq("run_id", runId);

  if (error) {
    redirect(appendSearchParam(redirectTo, "error", "step_update_failed"));
  }

  await recordAdminAuditLog(supabase, {
    actorId: user.id,
    action: "workflow_step.update_status",
    resourceType: "workflow_step",
    resourceId: stepId,
    afterSnapshot: { status },
  });

  revalidatePath(`${ADMIN_WORKFLOWS_PATH}/${runId}`);
  redirect(appendSearchParam(redirectTo, "saved", "step"));
}

export async function requestWorkflowApprovalAction(formData: FormData) {
  const context = await requireAdminPermission("workflows.write");
  const { supabase, user } = context;
  const runId = getString(formData, "run_id");
  const stepId = getOptionalString(formData, "step_id");
  const title = getString(formData, "title") || "工作流产物审核";
  const redirectTo = getSafeRedirect(formData, `${ADMIN_WORKFLOWS_PATH}/${runId}`);

  if (!runId) {
    redirect(appendSearchParam(redirectTo, "error", "missing_run"));
  }

  const { error } = await supabase.from("workflow_approvals").insert({
    run_id: runId,
    step_id: stepId,
    approval_type: "artifact_review",
    title,
    requested_by: user.id,
  });

  if (error) {
    redirect(appendSearchParam(redirectTo, "error", "approval_create_failed"));
  }

  revalidatePath(`${ADMIN_WORKFLOWS_PATH}/${runId}`);
  redirect(appendSearchParam(redirectTo, "saved", "approval"));
}

export async function runWorkflowAiJobAction(formData: FormData) {
  const context = await requireAdminPermission("ai_jobs.run");
  const { supabase, user } = context;
  const runId = getString(formData, "run_id");
  const stepId = getString(formData, "step_id");
  const jobType = getString(formData, "job_type") || "event_workflow_draft";
  const redirectTo = getSafeRedirect(formData, `${ADMIN_WORKFLOWS_PATH}/${runId}`);

  if (!runId || !stepId) {
    redirect(appendSearchParam(redirectTo, "error", "missing_ai_target"));
  }

  const [{ data: run }, { data: step }] = await Promise.all([
    supabase
      .from("workflow_runs")
      .select("id, title, summary, metadata")
      .eq("id", runId)
      .maybeSingle(),
    supabase
      .from("workflow_steps")
      .select("id, title, description, input_snapshot, output_snapshot")
      .eq("id", stepId)
      .eq("run_id", runId)
      .maybeSingle(),
  ]);

  if (!run || !step) {
    redirect(appendSearchParam(redirectTo, "error", "ai_target_missing"));
  }

  const { data: job, error: jobError } = await supabase
    .from("ai_jobs")
    .insert({
      run_id: runId,
      step_id: stepId,
      job_type: jobType,
      engine: "deepseek",
      status: "running",
      input_snapshot: {
        run,
        step,
      },
      created_by: user.id,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (jobError || !job?.id) {
    redirect(appendSearchParam(redirectTo, "error", "ai_job_create_failed"));
  }

  try {
    const result = await runWorkflowDeepSeekJob({
      jobType,
      runTitle: run.title,
      runSummary: run.summary,
      stepTitle: step.title,
      stepDescription: step.description,
      context: {
        workflow_metadata: run.metadata,
        step_input: step.input_snapshot,
        previous_output: step.output_snapshot,
      },
    });

    const now = new Date().toISOString();

    await Promise.all([
      supabase
        .from("ai_jobs")
        .update({
          model: result.model,
          status: "needs_review",
          output_snapshot: result.output,
          completed_at: now,
        })
        .eq("id", job.id),
      supabase
        .from("workflow_steps")
        .update({
          status: "waiting_review",
          output_snapshot: result.output,
        })
        .eq("id", stepId),
      supabase.from("workflow_artifacts").insert({
        run_id: runId,
        step_id: stepId,
        artifact_type: result.output.drafts.length > 0 ? "social_draft" : "brief",
        title: result.output.title || `${step.title} AI 草稿`,
        description: result.output.summary,
        visibility: "internal",
        status: "in_review",
        created_by: user.id,
        metadata: {
          ai_job_id: job.id,
          engine: "deepseek",
          job_type: jobType,
        },
      }),
    ]);

    await recordAdminAuditLog(supabase, {
      actorId: user.id,
      action: "ai_job.run",
      resourceType: "ai_job",
      resourceId: job.id,
      afterSnapshot: {
        job_type: jobType,
        step_id: stepId,
        status: "needs_review",
      },
    });
  } catch (error) {
    await supabase
      .from("ai_jobs")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "unknown_ai_error",
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    revalidatePath(`${ADMIN_WORKFLOWS_PATH}/${runId}`);
    redirect(
      appendSearchParam(
        redirectTo,
        "error",
        error instanceof Error && error.message === "missing_deepseek_api_key"
          ? "missing_deepseek_api_key"
          : "ai_job_failed",
      ),
    );
  }

  revalidatePath(`${ADMIN_WORKFLOWS_PATH}/${runId}`);
  redirect(appendSearchParam(redirectTo, "saved", "ai"));
}
