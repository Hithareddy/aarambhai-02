import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { TutorChatInterface } from "@/components/tutor-chat-interface";
import { useLanguage } from "@/hooks/use-language";

export const Route = createFileRoute("/_app/ai-tutor")({
  component: AITutorPage,
});

function AITutorPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="🤖 AI Tutor"
        description="Your personal conversational language learning companion. Practice anytime in a safe, encouraging space."
      />

      <div className="max-w-4xl mx-auto">
        <TutorChatInterface />
      </div>
    </div>
  );
}
