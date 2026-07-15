import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, MapPin, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_public/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Aarambh AI" },
      { name: "description", content: "Reach out to the Aarambh AI team — we'd love to hear from you." },
      { property: "og:title", content: "Contact Aarambh AI" },
      { property: "og:description", content: "Get in touch with our team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Contact"
        title="We'd love to hear from you"
        description="Questions, partnerships, feedback — send us a note and we'll get back to you soon."
      />
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-6 sm:p-8">
          <form
            className="grid gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
              toast.success("Message received — we'll be in touch.");
            }}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" required placeholder="Priya Sharma" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required placeholder="you@example.com" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" required placeholder="How can we help?" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" required rows={6} placeholder="Tell us a little more…" />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit">Send message</Button>
              {sent && <span className="text-sm text-success">Thanks! We received your note.</span>}
            </div>
          </form>
        </Card>
        <div className="space-y-4">
          <Card className="p-6">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold">Email</p>
            <p className="text-sm text-muted-foreground">hello@aarambh.ai</p>
          </Card>
          <Card className="p-6">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold">Support</p>
            <p className="text-sm text-muted-foreground">Response within 1 business day.</p>
          </Card>
          <Card className="p-6">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold">Studio</p>
            <p className="text-sm text-muted-foreground">Hyderabad, India</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
