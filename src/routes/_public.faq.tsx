import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/_public/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Aarambh AI" },
      { name: "description", content: "Answers to common questions about Aarambh AI." },
      { property: "og:title", content: "Aarambh AI — FAQ" },
      { property: "og:description", content: "Common questions, gently answered." },
    ],
  }),
  component: FAQPage,
});

const faqs = [
  { q: "Who is Aarambh AI for?", a: "Anyone who wants to learn — first-time learners, students, working adults and seniors." },
  { q: "Do I need to know English?", a: "No. You can use Aarambh AI in five languages including తెలుగు, हिन्दी, தமிழ் and मराठी." },
  { q: "Is there a test to start?", a: "There is a short, gentle check — but no pass, no fail. It just helps us begin at the right place." },
  { q: "Is my data safe?", a: "Yes. Your learning journey belongs to you. We only use your data to make lessons more useful for you." },
  { q: "Is Aarambh AI free?", a: "Aarambh AI offers a generous free experience. Premium options may be added later." },
  { q: "Can I use it on my phone?", a: "Yes. Aarambh AI works beautifully on phones, tablets, and desktops." },
];

function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="FAQ"
        title="Questions, gently answered"
        description="If your question isn't here, write to us — we'd love to help."
      />
      <Accordion type="single" collapsible className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={String(i)} className="border-none px-5">
            <AccordionTrigger className="text-left text-base font-medium">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
