import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Pencil, Camera } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — Aarambh AI" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title="Your Aarambh profile"
        description="This is how Aarambh AI knows you."
        actions={
          <Button variant="outline" className="gap-2">
            <Pencil className="h-4 w-4" /> Edit profile
          </Button>
        }
      />

      <Card className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarFallback className="bg-primary text-2xl text-primary-foreground">AA</AvatarFallback>
          </Avatar>
          <button
            aria-label="Change photo"
            className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full border border-border bg-background text-foreground shadow-sm hover:bg-muted"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">Aarambh Learner</h2>
          <p className="text-sm text-muted-foreground">Beginner · Everyday English</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">🇮🇳 India</Badge>
            <Badge variant="secondary">English · Telugu</Badge>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-display text-lg font-semibold">Personal information</h3>
          <div className="mt-4 grid gap-4">
            <Field label="Full name" defaultValue="Aarambh Learner" />
            <Field label="Email" defaultValue="learner@example.com" type="email" />
            <Field label="Age group" defaultValue="26 – 45" />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display text-lg font-semibold">Learning preferences</h3>
          <div className="mt-4 grid gap-4">
            <Field label="Primary language" defaultValue="English" />
            <Field label="Learning goal" defaultValue="Everyday English" />
            <Field label="Preferred pace" defaultValue="Gentle (10 min / day)" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, defaultValue, type = "text" }: { label: string; defaultValue: string; type?: string }) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} defaultValue={defaultValue} />
    </div>
  );
}
