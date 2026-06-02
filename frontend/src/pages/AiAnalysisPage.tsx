import { Sparkles } from 'lucide-react';

import { Page, PageHeader, SectionCard, SectionHeader } from '../components/ui/Page';

export function AiAnalysisPage() {
  return (
    <Page>
      <PageHeader
        eyebrow="Pro Intelligence"
        title="AI Analysis"
        description="This page is wired for Pro users. You can add your AI inventory summaries here."
      />

      <SectionCard className="overflow-hidden border-white/10 bg-black/60 text-white">
        <SectionHeader
          title="Summarize with Pro"
          description="Coming soon — connect dashboards, demand signals, and AI summaries."
          actions={<Sparkles className="h-4 w-4 text-indigo-300" />}
        />
        <div className="p-5 text-sm text-white/70">
          Placeholder page for `/ai-analysis`. Update this later with your Pro summarization experience.
        </div>
      </SectionCard>
    </Page>
  );
}

