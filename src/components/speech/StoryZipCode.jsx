import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DownloadButton from "@/components/DownloadButton";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { Plus, MapPin, X, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ZIP_CODE_SUGGESTIONS = [
  "Cultural Diversity", "Trauma & Resilience", "Grit & Perseverance",
  "Wisdom & Growth", "Identity & Belonging", "Fear to Courage",
  "Loss & Redemption", "Entrepreneurship", "Faith & Purpose", "Motherhood / Family"
];

export default function StoryZipCode({ stories, onStoriesChange }) {
  const [showForm, setShowForm] = useState(false);
  const [activeStory, setActiveStory] = useState(null);
  const [filterZip, setFilterZip] = useState("");
  const [form, setForm] = useState({ title: "", zip_code: "", story: "", key_message: "", hook: "", tags: [] });

  const update = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = async () => {
    const created = await base44.entities.SpeechStory.create(form);
    onStoriesChange([created, ...stories]);
    setForm({ title: "", zip_code: "", story: "", key_message: "", hook: "", tags: [] });
    setShowForm(false);
  };

  const filtered = filterZip ? stories.filter(s => s.zip_code?.toLowerCase().includes(filterZip.toLowerCase())) : stories;

  const groupedByZip = filtered.reduce((acc, s) => {
    const zip = s.zip_code || "Uncategorized";
    if (!acc[zip]) acc[zip] = [];
    acc[zip].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Story Zip Codes
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Each "zip code" is a niche or theme your stories live in — ready to deploy anywhere.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Story
        </Button>
      </div>

      {/* Filter */}
      {stories.length > 0 && (
        <Input placeholder="Filter by zip code..." value={filterZip}
          onChange={e => setFilterZip(e.target.value)} className="max-w-xs" />
      )}

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-card rounded-xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-medium">Archive a New Story</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div>
              <Label>Story Title</Label>
              <Input value={form.title} onChange={e => update("title", e.target.value)}
                placeholder="Give your story a name..." className="mt-1" />
            </div>

            <div>
              <Label>Zip Code (Niche / Theme)</Label>
              <Input value={form.zip_code} onChange={e => update("zip_code", e.target.value)}
                placeholder="e.g. Cultural Diversity, Trauma, Grit..." className="mt-1" />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {ZIP_CODE_SUGGESTIONS.map(z => (
                  <button key={z} onClick={() => update("zip_code", z)}
                    className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-primary/10 hover:text-primary border border-border transition-colors">
                    {z}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Opening Hook</Label>
              <Textarea value={form.hook} onChange={e => update("hook", e.target.value)}
                placeholder="The first line that grabs them..." rows={2} className="mt-1" />
            </div>

            <div>
              <Label>The Story</Label>
              <Textarea value={form.story} onChange={e => update("story", e.target.value)}
                placeholder="Write the full story here..." rows={5} className="mt-1" />
            </div>

            <div>
              <Label>Core Message / Key Takeaway</Label>
              <Textarea value={form.key_message} onChange={e => update("key_message", e.target.value)}
                placeholder="What do you want the audience to leave with?" rows={2} className="mt-1" />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!form.title || !form.zip_code || !form.story} className="flex-1">
                Archive Story
              </Button>
              <DownloadButton
                filename={`story_${(form.title || "draft").replace(/\s+/g, "_")}.txt`}
                content={`STORY: ${form.title}\nZIP CODE: ${form.zip_code}\n\nHOOK:\n${form.hook}\n\nSTORY:\n${form.story}\n\nKEY MESSAGE:\n${form.key_message}`}
                label="Download"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stories Grouped by Zip Code */}
      {Object.keys(groupedByZip).length === 0 ? (
        <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed border-border">
          <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-heading font-medium">No stories archived yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Every story you've lived is a zip code waiting to inspire someone.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByZip).map(([zip, zipStories]) => (
            <div key={zip}>
              <h3 className="font-heading text-sm font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> {zip}
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {zipStories.map(story => (
                  <button key={story.id} onClick={() => setActiveStory(story)}
                    className="bg-card text-left rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all group">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-heading font-medium text-sm">{story.title}</p>
                        {story.hook && <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">"{story.hook}"</p>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Story Detail Modal */}
      <AnimatePresence>
        {activeStory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
            onClick={() => setActiveStory(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-lg">
              <div className="flex items-start justify-between mb-1">
                <span className="text-xs text-primary font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {activeStory.zip_code}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 -mt-1" onClick={() => setActiveStory(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <h2 className="font-heading text-xl font-semibold mb-4">{activeStory.title}</h2>
              {activeStory.hook && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
                  <p className="text-xs text-primary font-medium mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Hook</p>
                  <p className="text-sm italic">"{activeStory.hook}"</p>
                </div>
              )}
              <div className="bg-muted/40 rounded-lg p-4 mb-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{activeStory.story}</p>
              </div>
              {activeStory.key_message && (
                <div className="border-l-4 border-primary pl-4">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Core Message</p>
                  <p className="text-sm">{activeStory.key_message}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}