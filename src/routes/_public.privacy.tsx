import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_public/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Aarambh AI" },
      { name: "description", content: "How Aarambh AI collects, uses and protects your information." },
      { property: "og:title", content: "Aarambh AI — Privacy Policy" },
      { property: "og:description", content: "Our commitment to learner privacy." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description="This page is maintained by Aarambh AI. It describes how we collect, use, and protect information about learners using our platform."
      />
      <div className="prose prose-slate mt-10 max-w-none text-sm">
        <h2>Overview</h2>
        <p className="text-muted-foreground">
          We collect only what we need to give you a helpful, personal learning experience. This
          page is a placeholder for the full privacy policy that Aarambh AI will publish before
          launch.
        </p>
        <h2>What we collect</h2>
        <p className="text-muted-foreground">
          Basic profile information you provide (like your name and language), and learning-related
          data (lessons completed, progress) so we can adapt to you.
        </p>
        <h2>How we use it</h2>
        <p className="text-muted-foreground">
          To personalise your learning experience and improve the product. We do not sell your data.
        </p>
        <h2>Your choices</h2>
        <p className="text-muted-foreground">
          You can request a copy of your data or delete your account at any time from Settings.
        </p>
        <p className="mt-8 text-xs text-muted-foreground">
          This document is illustrative and will be replaced with a full legal policy prior to launch.
        </p>
      </div>
    </div>
  );
}
