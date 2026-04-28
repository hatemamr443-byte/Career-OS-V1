import { useState } from "react";
import { z } from "zod";
import LegalLayout from "@/components/landing/LegalLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, Twitter } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

const Contact = () => {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const parsed = contactSchema.safeParse({
      name: fd.get("name"),
      email: fd.get("email"),
      message: fd.get("message"),
    });
    if (!parsed.success) {
      toast({ title: "Check your details", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert([parsed.data]);
    setSubmitting(false);
    if (error) {
      toast({ title: "Could not send message", description: error.message, variant: "destructive" });
      return;
    }
    form.reset();
    toast({
      title: "Message sent",
      description: "Thanks! We'll get back to you within one business day.",
    });
  };

  return (
    <LegalLayout
      title="Contact us"
      subtitle="Questions, feedback, or partnership ideas? We'd love to hear from you."
    >
      <div className="grid gap-8 md:grid-cols-[1fr_240px]">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required maxLength={100} placeholder="Ada Lovelace" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required maxLength={255} placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" name="message" required maxLength={2000} rows={5} placeholder="How can we help?" />
          </div>
          <Button type="submit" variant="hero" size="lg" disabled={submitting}>
            {submitting ? "Sending…" : "Send message"}
          </Button>
        </form>

        <aside className="space-y-4 text-sm">
          <div className="rounded-xl border border-border bg-card/40 p-4">
            <div className="flex items-center gap-2 text-foreground">
              <Mail className="h-4 w-4 text-accent" />
              <span className="font-medium">Email</span>
            </div>
            <p className="mt-1 text-muted-foreground">hello@careeros.app</p>
          </div>
          <div className="rounded-xl border border-border bg-card/40 p-4">
            <div className="flex items-center gap-2 text-foreground">
              <MessageSquare className="h-4 w-4 text-accent" />
              <span className="font-medium">Support</span>
            </div>
            <p className="mt-1 text-muted-foreground">support@careeros.app</p>
          </div>
          <div className="rounded-xl border border-border bg-card/40 p-4">
            <div className="flex items-center gap-2 text-foreground">
              <Twitter className="h-4 w-4 text-accent" />
              <span className="font-medium">Social</span>
            </div>
            <p className="mt-1 text-muted-foreground">@careeros</p>
          </div>
        </aside>
      </div>
    </LegalLayout>
  );
};

export default Contact;
