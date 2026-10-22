"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ClaimFormProps = {
  variant?: "primary" | "accent";
};

const MAX_HANDLE_LENGTH = 30;

function cleanHandle(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, MAX_HANDLE_LENGTH);
}

export function ClaimForm({ variant = "primary" }: ClaimFormProps) {
  const router = useRouter();
  const [handle, setHandle] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(handle ? `/sign-in?handle=${encodeURIComponent(handle)}` : "/sign-in");
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-[540px] flex-wrap gap-2.5 text-left">
      <div className="flex min-w-0 flex-[1_1_260px] flex-col justify-center">
        <Input
          prefix="linkbase.me/"
          placeholder="yourname"
          aria-label="Choose a username"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={MAX_HANDLE_LENGTH}
          value={handle}
          onChange={(event) => setHandle(cleanHandle(event.target.value))}
        />
      </div>
      <div className="flex flex-[1_0_auto]">
        <Button type="submit" variant={variant} size="lg" fullWidth>
          Claim your Linkbase
        </Button>
      </div>
    </form>
  );
}
