import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Max inactivity days allowed — users can set LESS but never more.
const MAX_INACTIVITY_DAYS = 3;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const users = await base44.asServiceRole.entities.User.list();

    // Get all steps completed in the last MAX_INACTIVITY_DAYS days (our widest window)
    const wideCutoff = new Date();
    wideCutoff.setDate(wideCutoff.getDate() - MAX_INACTIVITY_DAYS);
    const wideCutoffStr = wideCutoff.toISOString().split("T")[0];

    const recentSteps = await base44.asServiceRole.entities.ActionStep.filter({
      completed_date: { $gte: wideCutoffStr },
      is_completed: true,
    });

    // Map: email → most recent completed_date
    const lastActiveByEmail = {};
    for (const s of recentSteps) {
      if (!s.created_by || !s.completed_date) continue;
      const prev = lastActiveByEmail[s.created_by];
      if (!prev || s.completed_date > prev) {
        lastActiveByEmail[s.created_by] = s.completed_date;
      }
    }

    const today = new Date().toISOString().split("T")[0];

    let emailsSent = 0;
    for (const user of users) {
      if (!user.email) continue;

      // Per-user threshold: 1–3 days, capped at MAX
      const threshold = Math.min(
        Math.max(1, user.inactivity_reminder_days || MAX_INACTIVITY_DAYS),
        MAX_INACTIVITY_DAYS
      );

      const lastActive = lastActiveByEmail[user.email];
      if (lastActive) {
        const daysSince = Math.floor((new Date(today) - new Date(lastActive)) / 86400000);
        if (daysSince < threshold) continue; // still within their threshold
      }
      // If no lastActive found at all, they've never completed a step — send reminder

      const firstName = user.full_name?.split(" ")[0] || "there";

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        from_name: "Your A.C.E.S. Coach",
        subject: "Hey — your goals are waiting for you 💛",
        body: `Hi ${firstName},\n\nIt looks like it's been a few days since you've checked in on your A.C.E.S. journey.\n\nYour goals haven't changed — they're still waiting for you, exactly where you left them.\n\nEven 15 minutes of focus today can keep your momentum alive. Small steps compound.\n\n👉 Log in and take one action today.\n\nYou've got this.\n\n— Your A.C.E.S. Coach\n\nReply to this email or reach out at coach@centeredresponse.com anytime.\n\n(To change how often you receive these reminders, visit your profile settings in the app.)`,
      });
      emailsSent++;
    }

    return Response.json({ success: true, emailsSent, checkedUsers: users.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});