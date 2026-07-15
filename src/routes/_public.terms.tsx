import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_public/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Aarambh AI" },
      { name: "description", content: "The terms that govern use of Aarambh AI." },
      { property: "og:title", content: "Aarambh AI — Terms & Conditions" },
      { property: "og:description", content: "Our terms of use." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Legal"
        title="Terms & Conditions"
        description="This page is maintained by Aarambh AI. Please read carefully before using our services."
      />
      <div className="prose prose-slate mt-10 max-w-none text-sm">
        <h2>Use of the service</h2>
        <p className="text-muted-foreground">
          Aarambh AI is provided for personal, non-commercial learning. By using the service, you
          agree to use it respectfully and lawfully.
        </p>
        <h2>Accounts</h2>
        <p className="text-muted-foreground">
          You are responsible for keeping your account credentials safe. Please contact us if you
          suspect any unauthorised access.
        </p>
        <h2>Content</h2>
        <p className="text-muted-foreground">
          All learning content is provided as-is and may be updated over time as we learn more.
        </p>
        <h2>Contact</h2>
        <p className="text-muted-foreground">Questions? Reach us at hello@aarambh.ai.</p>
        <p className="mt-8 text-xs text-muted-foreground">
          This document is illustrative and will be replaced with a full legal terms document prior to launch.
        </p>
      </div>
    </div>
  );
}
