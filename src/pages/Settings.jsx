import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { UserEntities } from "@/lib/userEntities";
import CloudConnections from "@/components/settings/CloudConnections";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Trash2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [reminderDays, setReminderDays] = useState(3);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setReminderDays(u?.inactivity_reminder_days || 3);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({ inactivity_reminder_days: reminderDays });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your preferences.</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div>
          <h2 className="font-heading text-lg font-medium">Inactivity Reminders</h2>
          <p className="text-muted-foreground text-sm mt-1">
            How many days without completing a step before we send you a nudge? 
            You can set this to 1–3 days.
          </p>
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map((d) => (
            <label
              key={d}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                reminderDays === d
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/30"
              }`}
            >
              <input
                type="radio"
                name="reminderDays"
                value={d}
                checked={reminderDays === d}
                onChange={() => setReminderDays(d)}
                className="accent-primary"
              />
              <div>
                <p className="text-sm font-medium">
                  {d === 1 ? "Every day" : `After ${d} days`}
                  {d === 3 ? " (default)" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {d === 1
                    ? "Remind me daily if I haven't completed a step"
                    : d === 2
                    ? "Remind me if I go 2 days without progress"
                    : "Give me a little grace — remind me after 3 days"}
                </p>
              </div>
            </label>
          ))}
        </div>

        <p className="text-xs text-muted-foreground italic">
          Note: Reminders only trigger if you haven't completed any action steps within your chosen window. Going on vacation? Just know the reminder will come after {reminderDays} {reminderDays === 1 ? "day" : "days"}.
        </p>

        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : null}
          {saved ? "Saved!" : "Save Preferences"}
        </Button>
      </div>
      <CloudConnections />

      {/* Delete Account */}
      <div className="bg-card rounded-2xl border border-destructive/30 p-6 space-y-4">
        <div>
          <h2 className="font-heading text-lg font-medium text-destructive">Danger Zone</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2" disabled={deletingAccount}>
              {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete My Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Delete your account?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your account, all goals, action steps, journal entries, and coaching sessions. <strong>This action cannot be undone.</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  setDeletingAccount(true);
                  // Delete only THIS user's data
                  const [goals, steps, sessions, reflections, toolboxEntries, checkins] = await Promise.all([
                    UserEntities.QuarterGoal.list(),
                    UserEntities.ActionStep.list(),
                    UserEntities.CoachingSession.list(),
                    UserEntities.Reflection.list(),
                    UserEntities.ToolboxEntry.list(),
                    UserEntities.WeeklyCheckin.list(),
                  ]);
                  await Promise.all([
                    ...goals.map(e => base44.entities.QuarterGoal.delete(e.id)),
                    ...steps.map(e => base44.entities.ActionStep.delete(e.id)),
                    ...sessions.map(e => base44.entities.CoachingSession.delete(e.id)),
                    ...reflections.map(e => base44.entities.Reflection.delete(e.id)),
                    ...toolboxEntries.map(e => base44.entities.ToolboxEntry.delete(e.id)),
                    ...checkins.map(e => base44.entities.WeeklyCheckin.delete(e.id)),
                  ]);
                  base44.auth.logout("/");
                }}
              >
                Yes, delete everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}