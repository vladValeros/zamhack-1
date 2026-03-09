// src/app/(company)/company/challenges/[id]/edit/page.tsx
import { notFound, redirect } from "next/navigation";
import { getChallengeForEdit } from "@/app/challenges/edit-actions";
import { createClient } from "@/utils/supabase/server";
import EditChallengeForm from "./edit-challenge-form";

const DIRECT_EDIT_STATUSES = ["draft", "pending_approval"];

export default async function EditChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const challenge = await getChallengeForEdit(id);
  if (!challenge) notFound();

  // Only the creator can edit
  if (challenge.created_by !== user.id) redirect(`/company/challenges/${id}`);

  const isLiveEdit = !DIRECT_EDIT_STATUSES.includes(challenge.status ?? "");

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Edit Challenge</h1>

      {isLiveEdit && (
        <div className="mb-6 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <strong>Heads up:</strong> This challenge is currently live. Your
          changes will be submitted for admin review and won't be applied until
          approved.
        </div>
      )}

      <EditChallengeForm challenge={challenge} isLiveEdit={isLiveEdit} />
    </div>
  );
}