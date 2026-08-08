"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * "Resend code", with a countdown.
 *
 * The API silently ignores a resend inside its own 60s cooldown, so without the timer
 * the button would look broken: it would report success and no second email would ever
 * arrive. The countdown starts at mount because a code was just sent to get here.
 */
export const ResendCodeButton = ({
  onResend,
  cooldownSeconds = 60,
}: {
  onResend: () => Promise<void>;
  cooldownSeconds?: number;
}) => {
  const [secondsLeft, setSecondsLeft] = useState(cooldownSeconds);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const handleResend = async () => {
    setIsSending(true);
    try {
      await onResend();
      setSecondsLeft(cooldownSeconds);
    } finally {
      setIsSending(false);
    }
  };

  if (secondsLeft > 0) {
    return (
      <p className="text-text-muted mt-5 text-center text-[13px]">
        Reenviar código em {secondsLeft}s
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={isSending}
      className="text-text-sub hover:text-green mt-5 flex w-full items-center justify-center gap-2 text-center text-[13px] disabled:opacity-60"
    >
      {isSending && <Loader2 size={13} className="animate-spin" />}
      Reenviar código
    </button>
  );
};
