// userEntities.js — Wrapper that filters all entity calls by current user
// Handles existing records that don't have created_by set yet

import { base44 } from "@/api/base44Client";

let _currentUser = null;

export async function getCurrentUser() {
  if (_currentUser) return _currentUser;
  try {
    _currentUser = await base44.auth.me();
    return _currentUser;
  } catch {
    return null;
  }
}

export async function getCurrentUserId() {
  const user = await getCurrentUser();
  return user?.id || null;
}

// Wraps any entity to auto-filter by created_by
// Falls back to client-side filtering if server filter returns empty
// This handles existing records created before privacy fix
export function userScoped(entity) {
  return {
    async list(order, limit) {
      const user = await getCurrentUser();
      if (!user) return [];
      // Try server-side filter first
      const filtered = await entity.filter({ created_by: user.id }, order, limit);
      if (filtered.length > 0) return filtered;
      // Fall back: get all and filter client-side (for old records)
      const all = await entity.list(order, limit);
      return all.filter(r => !r.created_by || r.created_by === user.id || r.created_by === user.email);
    },
    async filter(filters, order, limit) {
      const user = await getCurrentUser();
      if (!user) return [];
      const filtered = await entity.filter({ ...filters, created_by: user.id }, order, limit);
      if (filtered.length > 0) return filtered;
      // Fall back to getting all matching filters then client-side user filter
      const all = await entity.filter(filters, order, limit);
      return all.filter(r => !r.created_by || r.created_by === user.id || r.created_by === user.email);
    },
    async create(data) {
      return entity.create(data);
    },
    async update(id, data) {
      return entity.update(id, data);
    },
    async delete(id) {
      return entity.delete(id);
    },
  };
}

// Pre-scoped entity shortcuts
export const UserEntities = {
  get QuarterGoal()      { return userScoped(base44.entities.QuarterGoal); },
  get ActionStep()       { return userScoped(base44.entities.ActionStep); },
  get DailyCheckin()     { return userScoped(base44.entities.DailyCheckin); },
  get SelfCareLog()      { return userScoped(base44.entities.SelfCareLog); },
  get Reflection()       { return userScoped(base44.entities.Reflection); },
  get WeeklyCheckin()    { return userScoped(base44.entities.WeeklyCheckin); },
  get CoachingSession()  { return userScoped(base44.entities.CoachingSession); },
  get ToolboxEntry()     { return userScoped(base44.entities.ToolboxEntry); },
  get ToolReflection()   { return userScoped(base44.entities.ToolReflection); },
  get BrainDumpNote()    { return userScoped(base44.entities.BrainDumpNote); },
  get Hook()             { return userScoped(base44.entities.Hook); },
  get SpeechDraft()      { return userScoped(base44.entities.SpeechDraft); },
  get SpeechStory()      { return userScoped(base44.entities.SpeechStory); },
  get CustomTool()       { return userScoped(base44.entities.CustomTool); },
};