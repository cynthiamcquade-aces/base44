import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { UserEntities } from "@/lib/userEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DownloadButton from "@/components/DownloadButton";
import { Label } from "@/components/ui/label";
import { MobileSelect, MobileSelectItem } from "@/components/ui/mobile-select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, X, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const ENGAGEMENT_TYPES = [
  { value: "lead_magnet", label: "Lead Magnet" },
  { value: "paid_speaking", label: "Paid Speaking" },
  { value: "webinar", label: "Webinar" },
  { value: "coaching", label: "Coaching Session" },
  { value: "training", label: "Training" },
  { value: "other", label: "Other" },
];

const TALK_LENGTHS = [
  { value: "5min", label: "5 Minutes" },
  { value: "15min", label: "15 Minutes" },
  { value: "30min", label: "30 Minutes" },
  { value: "1hr", label: "1 Hour" },
  { value: "halfday", label: "Half Day (4 hours)" },
  { value: "fullday", label: "Full Day (8 hours)" },
];

const STORY_VERSIONS = [
  { value: "3min", label: "3-Minute Version" },
  { value: "10min", label: "10-Minute Version" },
  { value: "full", label: "Full Version" },
];

const TALK_COMPONENTS = {
  "5min": ["Hook", "Key Insight", "Story", "Call to Action"],
  "15min": ["Hook", "Problem Setup", "Story 1", "Key Insight", "Story 2", "Call to Action"],
  "30min": ["Hook", "Problem Setup", "Story 1", "Key Insight", "Story 2", "Application", "Story 3", "Call to Action"],
  "1hr": ["Hook", "Problem Setup", "Story 1", "Key Insight", "Story 2", "Deep Dive", "Story 3", "Application", "Q&A", "Call to Action"],
  "halfday": ["Opening Hook", "Story 1", "Segment 1 Teaching", "Story 2", "Interactive Exercise", "Story 3", "Segment 2 Teaching", "Story 4", "Breakout Activity", "Story 5", "Closing & Call to Action"],
  "fullday": ["Opening Hook", "Story 1", "Module 1 Teaching", "Story 2", "Workshop Activity", "Story 3", "Lunch Break", "Story 4", "Module 2 Teaching", "Story 5", "Small Group Activity", "Story 6", "Module 3 Teaching", "Story 7", "Celebration & Call to Action"],
};

export default function SpeakingEngagementDraft({ stories = [] }) {
  const [engagements, setEngagements] = useState([]);
  const [savedHooks, setSavedHooks] = useState([]);
  const [newHookMode, setNewHookMode] = useState({});

  useEffect(() => {
    UserEntities.Hook.list().then(setSavedHooks);
  }, []);

  const storiesByZipCode = stories.reduce((acc, story) => {
    if (!acc[story.zip_code]) acc[story.zip_code] = [];
    acc[story.zip_code].push(story);
    return acc;
  }, {});

  const addEngagement = () => {
    const newId = Date.now().toString();
    setEngagements([
      ...engagements,
      {
        id: newId,
        title: "",
        type: "",
        length: "",
        outline: "",
        components: [],
      },
    ]);
  };

  const removeEngagement = (id) => {
    setEngagements(engagements.filter(e => e.id !== id));
  };

  const updateEngagement = (id, field, value) => {
    setEngagements(
      engagements.map(e => {
        if (e.id === id) {
          const updated = { ...e, [field]: value };
          if (field === "length" && TALK_COMPONENTS[value]) {
           updated.components = TALK_COMPONENTS[value].map((comp, idx) => ({
             id: idx,
             title: comp,
             selectedStoryZipCode: "",
             selectedStory: null,
             storyTime: "",
             selectedHook: "",
             keyPoints: "",
             outline: "",
             craftedContent: "",
             transitions: "",
             timing: "",
             audience: "",
           }));
          }
          return updated;
        }
        return e;
      })
    );
  };

  const updateComponent = (engagementId, compIdx, field, value) => {
    setEngagements(
      engagements.map(e => {
        if (e.id === engagementId) {
          const updated = { ...e };
          updated.components[compIdx] = {
            ...updated.components[compIdx],
            [field]: value,
            ...(field === "selectedStoryZipCode" && { selectedStory: null, storyTime: "" }),
          };
          return updated;
        }
        return e;
      })
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold">Speaking Engagements</h3>
        <Button onClick={addEngagement} variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> New Engagement
        </Button>
      </div>

      {engagements.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <p>No speaking engagements yet. Create one to start building your talk.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {engagements.map(engagement => (
            <motion.div
              key={engagement.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-border rounded-xl overflow-hidden"
            >
              <Accordion type="single" collapsible defaultValue="details">
                <AccordionItem value="details" className="border-0">
                  <AccordionTrigger className="px-5 py-4 hover:bg-muted/30 data-[state=open]:bg-muted/20">
                    <div className="flex-1 text-left">
                      <p className="font-medium">
                        {engagement.title || "Untitled Engagement"}{" "}
                        {engagement.type && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({ENGAGEMENT_TYPES.find(t => t.value === engagement.type)?.label})
                          </span>
                        )}
                      </p>
                      {engagement.length && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {TALK_LENGTHS.find(l => l.value === engagement.length)?.label}
                        </p>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 py-4 border-t border-border space-y-4">
                    {/* Basic Info */}
                    <div>
                      <Label className="text-sm font-medium">Title of Talk</Label>
                      <Input
                        value={engagement.title}
                        onChange={e => updateEngagement(engagement.id, "title", e.target.value)}
                        placeholder="e.g. Finding Your Voice, The Resilience Blueprint"
                        className="mt-2"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                       <Label className="text-sm font-medium">Type of Engagement</Label>
                       <MobileSelect
                         value={engagement.type}
                         onValueChange={v => updateEngagement(engagement.id, "type", v)}
                         placeholder="Select type..."
                         triggerClassName="mt-2"
                       >
                         {ENGAGEMENT_TYPES.map(t => (
                           <MobileSelectItem key={t.value} value={t.value}>{t.label}</MobileSelectItem>
                         ))}
                       </MobileSelect>
                      </div>

                      <div>
                       <Label className="text-sm font-medium">Talk Length</Label>
                       <MobileSelect
                         value={engagement.length}
                         onValueChange={v => updateEngagement(engagement.id, "length", v)}
                         placeholder="Select length..."
                         triggerClassName="mt-2"
                       >
                         {TALK_LENGTHS.map(l => (
                           <MobileSelectItem key={l.value} value={l.value}>{l.label}</MobileSelectItem>
                         ))}
                       </MobileSelect>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Overall Outline & Notes</Label>
                      <Textarea
                        value={engagement.outline}
                        onChange={e => updateEngagement(engagement.id, "outline", e.target.value)}
                        placeholder="Key points, flow, audience demographics, main theme..."
                        rows={3}
                        className="mt-2"
                      />
                    </div>

                    {/* Build Section */}
                    {engagement.length && (
                      <div className="pt-4 border-t border-border">
                        <h4 className="font-medium text-sm mb-4">Build Your Talk – Segment by Segment</h4>
                        <div className="space-y-5">
                          {engagement.components.map((comp, idx) => (
                            <div
                              key={comp.id}
                              className="bg-muted/20 rounded-xl border border-border p-5 space-y-4"
                            >
                              {/* Segment Header */}
                              <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-7 h-7 bg-primary text-primary-foreground rounded-lg text-xs font-semibold">
                                  {idx + 1}
                                </span>
                                <h5 className="font-heading font-medium text-base">{comp.title}</h5>
                              </div>

                              {/* Story Selection (Optional) */}
                              <div className="space-y-3 pb-4 border-b border-border">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  Story & Hook (Optional)
                                </p>
                                <div className="grid sm:grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs">Zip Code / Category</Label>
                                    <MobileSelect
                                      value={comp.selectedStoryZipCode}
                                      onValueChange={v =>
                                        updateComponent(engagement.id, idx, "selectedStoryZipCode", v)
                                      }
                                      placeholder="Select category..."
                                      triggerClassName="mt-1 h-8 text-sm"
                                    >
                                       {Object.keys(storiesByZipCode).map(zipCode => (
                                        <MobileSelectItem key={zipCode} value={zipCode}>{zipCode}</MobileSelectItem>
                                      ))}
                                    </MobileSelect>
                                  </div>

                                  {comp.selectedStoryZipCode && (
                                    <div>
                                      <Label className="text-xs">Story Title</Label>
                                      <MobileSelect
                                        value={comp.selectedStory?.id || ""}
                                        onValueChange={v => {
                                          const story = storiesByZipCode[comp.selectedStoryZipCode]?.find(s => s.id === v);
                                          updateComponent(engagement.id, idx, "selectedStory", story);
                                        }}
                                        placeholder="Select story..."
                                        triggerClassName="mt-1 h-8 text-sm"
                                      >
                                        {storiesByZipCode[comp.selectedStoryZipCode]?.map(story => (
                                          <MobileSelectItem key={story.id} value={story.id}>{story.title}</MobileSelectItem>
                                        ))}
                                      </MobileSelect>
                                    </div>
                                  )}
                                </div>

                                {comp.selectedStory && (
                                  <div className="space-y-3">
                                    <div>
                                      <Label className="text-xs">Story Length (minutes)</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={comp.storyTime}
                                        onChange={e =>
                                          updateComponent(engagement.id, idx, "storyTime", e.target.value)
                                        }
                                        placeholder="e.g. 3, 5, 10..."
                                        className="mt-1 text-sm"
                                      />
                                    </div>

                                    <div>
                                      <Label className="text-xs">Hook for this segment</Label>
                                      {!newHookMode[`${engagement.id}-${idx}`] ? (
                                        <div className="space-y-2 mt-1">
                                          <MobileSelect
                                             value={comp.selectedHook}
                                             onValueChange={v => updateComponent(engagement.id, idx, "selectedHook", v)}
                                             placeholder="Select a hook..."
                                             triggerClassName="h-8 text-sm"
                                           >
                                             <MobileSelectItem value="">— None —</MobileSelectItem>
                                             {savedHooks.map(hook => (
                                               <MobileSelectItem key={hook.id} value={hook.id}>{hook.title}</MobileSelectItem>
                                             ))}
                                           </MobileSelect>
                                          <Button
                                            onClick={() => setNewHookMode({ ...newHookMode, [`${engagement.id}-${idx}`]: true })}
                                            variant="outline"
                                            size="sm"
                                            className="w-full text-xs"
                                          >
                                            + Create New Hook
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="space-y-2 mt-1">
                                          <Textarea
                                            value={comp.selectedHook}
                                            onChange={e =>
                                              updateComponent(engagement.id, idx, "selectedHook", e.target.value)
                                            }
                                            placeholder="Write your hook here..."
                                            rows={2}
                                            className="text-sm"
                                          />
                                          <Button
                                            onClick={() => setNewHookMode({ ...newHookMode, [`${engagement.id}-${idx}`]: false })}
                                            variant="outline"
                                            size="sm"
                                            className="w-full text-xs"
                                          >
                                            Back to Hook Library
                                          </Button>
                                        </div>
                                      )}
                                    </div>

                                    {comp.selectedHook && !newHookMode[`${engagement.id}-${idx}`] && (
                                      <div className="bg-card rounded-lg p-3 border border-border text-xs space-y-1">
                                        <p className="font-medium text-foreground">Hook:</p>
                                        <p className="text-muted-foreground italic">
                                          "{savedHooks.find(h => h.id === comp.selectedHook)?.content || comp.selectedHook}"
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Worksheet: Crafting Guide */}
                              <div className="space-y-4">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  Crafting Worksheet
                                </p>

                                {/* 1. Key Teaching Points (First) */}
                                <div>
                                  <Label className="text-xs font-medium">Key teaching points or insights</Label>
                                  <Textarea
                                    value={comp.keyPoints}
                                    onChange={e =>
                                      updateComponent(engagement.id, idx, "keyPoints", e.target.value)
                                    }
                                    placeholder="What's the core message? What do you want them to remember?"
                                    rows={3}
                                    className="mt-1 text-sm"
                                  />
                                </div>

                                {/* 2. Outline (Research Paper Style) */}
                                <div>
                                  <Label className="text-xs font-medium">Outline (Roman numerals)</Label>
                                  <Textarea
                                    value={comp.outline}
                                    onChange={e =>
                                      updateComponent(engagement.id, idx, "outline", e.target.value)
                                    }
                                    placeholder={`I. Opening statement
   A. Hook or context
   B. Problem statement
II. Main point / Teaching
   A. Sub-point
   B. Sub-point
III. Story or example
IV. Key lesson / Takeaway`}
                                    rows={4}
                                    className="mt-1 text-sm font-mono"
                                  />
                                </div>

                                {/* 3. Full Scripted Content */}
                                <div>
                                  <Label className="text-xs font-medium">Full scripted content for this segment</Label>
                                  <Textarea
                                    value={comp.craftedContent}
                                    onChange={e =>
                                      updateComponent(engagement.id, idx, "craftedContent", e.target.value)
                                    }
                                    placeholder="Write out exactly what you'll say — your words, your style. This is your draft script for this section."
                                    rows={4}
                                    className="mt-1 text-sm"
                                  />
                                </div>

                                {/* 4. Transitions / Bridges (After Script) */}
                                <div>
                                  <Label className="text-xs font-medium">Transitions & bridges to next segment</Label>
                                  <Textarea
                                    value={comp.transitions}
                                    onChange={e =>
                                      updateComponent(engagement.id, idx, "transitions", e.target.value)
                                    }
                                    placeholder="How does this segment flow into the next one? Bridge language, connectors, phrases..."
                                    rows={2}
                                    className="mt-1 text-sm"
                                  />
                                </div>

                                {/* 5. Timing & Audience (Bottom) */}
                                <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                                  <div>
                                    <Label className="text-xs font-medium">Timing (minutes)</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      value={comp.timing}
                                      onChange={e =>
                                        updateComponent(engagement.id, idx, "timing", e.target.value)
                                      }
                                      placeholder="e.g. 3, 5, 10..."
                                      className="mt-1 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium">Audience notes</Label>
                                    <Input
                                      value={comp.audience}
                                      onChange={e =>
                                        updateComponent(engagement.id, idx, "audience", e.target.value)
                                      }
                                      placeholder="e.g. interactive, quiet, skeptical..."
                                      className="mt-1 text-sm"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-primary hover:text-primary"
                      >
                        <Sparkles className="w-4 h-4" /> Generate Full Speech
                      </Button>
                      <DownloadButton
                        filename={`engagement_${(engagement.title || "draft").replace(/\s+/g, "_")}.txt`}
                        content={[
                          `SPEAKING ENGAGEMENT: ${engagement.title || "Untitled"}`,
                          `Event: ${engagement.eventName || ""}`,
                          `Date: ${engagement.date || ""}`,
                          `Duration: ${engagement.duration || ""}`,
                          "",
                          ...(engagement.components || []).map((comp, i) =>
                            `SEGMENT ${i + 1}: ${comp.type || ""}\n${comp.craftedContent || comp.outline || comp.keyPoints || ""}`
                          ),
                        ].filter(Boolean).join("\n\n")}
                        size="sm"
                        label="Download"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeEngagement(engagement.id)}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" /> Delete
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}