import { revalidatePath } from "next/cache";

const ADMIN_EVENTS_PATH = "/admin/events";
const ADMIN_LEADS_PATH = "/admin/leads";
const ADMIN_MEMBERS_PATH = "/admin/members";

export function revalidateAdminEventPaths(eventId?: string, eventSlug?: string) {
  revalidatePath(ADMIN_EVENTS_PATH);
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/archive");

  if (eventId) {
    revalidatePath(`${ADMIN_EVENTS_PATH}/${eventId}`);
  }

  if (eventSlug) {
    revalidatePath(`/events/${eventSlug}`);
  }
}

export function revalidateAdminMemberPaths(memberId?: string) {
  revalidatePath(ADMIN_MEMBERS_PATH);
  revalidatePath("/members");

  if (memberId) {
    revalidatePath(`${ADMIN_MEMBERS_PATH}/${memberId}`);
  }
}

export function revalidateAdminLeadPaths(leadId?: string) {
  revalidatePath(ADMIN_LEADS_PATH);

  if (leadId) {
    revalidatePath(`${ADMIN_LEADS_PATH}/${leadId}`);
  }
}
