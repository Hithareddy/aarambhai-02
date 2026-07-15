import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LifeBuoy, MessageSquare, Search, BookOpen } from "lucide-react";

export const Route = createFileRoute("/_app/help")({
  head: () => ({ meta: [{ title: "Help & Support — Aarambh AI" }] }),
  component: HelpPage,
});

const help = [
  { q: "How do I change my language?", a: "Head to Settings → Appearance → Language to switch anytime." },
  { q: "Can I retake the assessment?", a: "Yes. Visit Assessments and choose retake — no pressure." },
  { q: "How is my learning path made?", a: "It's built from your onboarding answers and assessment results, then refined as you learn." },
  { q: "Where can I see my progress?", a: "Your Progress page has streaks, weekly activity, and skill breakdowns." },
];

function HelpPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Help"
        title="How can we help?"
        description="Guides and answers, kindly written."
      />

      <div className="relative max-w-lg">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search help articles…" className="pl-9" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="mt-2 font-display text-base font-semibold">Guides</h3>
          <p className="mt-1 text-sm text-muted-foreground">Step-by-step walkthroughs.</p>
          <Button asChild size="sm" variant="ghost" className="mt-2 px-0">
            <Link to="/resources">Browse guides →</Link>
          </Button>
        </Card>
        <Card className="p-5">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="mt-2 font-display text-base font-semibold">Contact us</h3>
          <p className="mt-1 text-sm text-muted-foreground">We usually reply within a day.</p>
          <Button asChild size="sm" variant="ghost" className="mt-2 px-0">
            <Link to="/contact">Get in touch →</Link>
          </Button>
        </Card>
        <Card className="p-5">
          <LifeBuoy className="h-5 w-5 text-primary" />
          <h3 className="mt-2 font-display text-base font-semibold">Community</h3>
          <p className="mt-1 text-sm text-muted-foreground">Ask other learners.</p>
          <Button asChild size="sm" variant="ghost" className="mt-2 px-0">
            <Link to="/community">Visit community →</Link>
          </Button>
        </Card>
      </div>

      <Card className="p-2 sm:p-4">
        <Accordion type="single" collapsible className="divide-y divide-border">
          {help.map((h, i) => (
            <AccordionItem key={i} value={String(i)} className="border-none px-3">
              <AccordionTrigger className="text-left text-base font-medium">{h.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{h.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>
    </div>
  );
}
