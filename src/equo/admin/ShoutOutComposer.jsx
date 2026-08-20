// eQuo — shout-out composer. Pick a coworker, write a one-line recognition, post.
// Pure recognition — no rating, kept separate from numeric scoring.
import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Megaphone, Send } from "lucide-react";
import { equoTheme as t, raised, inset } from "../equoTheme";
import { NeuTextarea, NeuPrimaryButton } from "../EquoPrimitives";
import { equoApi } from "../equoApi";
import { base44 } from "@/api/base44Client";

export default function ShoutOutComposer({ user }) {
  const queryClient = useQueryClient();
  const [toEmail, setToEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [coworkers, setCoworkers] = useState([]);

  // Load coworkers (other app users) for the picker
  React.useEffect(() => {
    base44.entities.User.list().then((users) => {
      setCoworkers(users.filter((u) => u.email !== user?.email));
    }).catch(() => {});
  }, [user?.email]);

  const handleSubmit = async () => {
    if (!toEmail || !message.trim()) return;
    setBusy(true);
    try {
      const recipient = coworkers.find((c) => c.email === toEmail);
      await equoApi.createShoutout({
        from_email: user.email,
        from_name: user.full_name || user.email,
        to_email: toEmail,
        to_name: recipient?.full_name || toEmail,
        message: message.trim(),
        is_public: true,
      });
      setMessage("");
      setToEmail("");
      queryClient.invalidateQueries({ queryKey: ["equo-admin"] });
      queryClient.invalidateQueries({ queryKey: ["equo-employee"] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6" style={raised(24)}>
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background: `linear-gradient(135deg, ${t.gold}, ${t.goldDeep})` }}
        >
          <Megaphone className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-black" style={{ color: t.text }}>Give a shout-out</h3>
          <p className="text-xs" style={{ color: t.textSoft }}>Recognize a coworker — pure recognition, no rating attached.</p>
        </div>
      </div>

      <select
        value={toEmail}
        onChange={(e) => setToEmail(e.target.value)}
        className="w-full px-4 py-3 text-sm outline-none mb-3"
        style={{ ...inset(12), color: t.text, border: "none" }}
      >
        <option value="">Pick a coworker…</option>
        {coworkers.map((c) => (
          <option key={c.email} value={c.email}>{c.full_name || c.email}</option>
        ))}
      </select>

      <NeuTextarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="One line of recognition…"
        rows={2}
      />

      <div className="flex justify-end mt-4">
        <NeuPrimaryButton onClick={handleSubmit} disabled={busy || !toEmail || !message.trim()}>
          <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Post shout-out</span>
        </NeuPrimaryButton>
      </div>
    </div>
  );
}