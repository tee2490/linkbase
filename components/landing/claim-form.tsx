import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ClaimFormProps = {
  id: string;
  buttonVariant: "forest" | "lime";
  className?: string;
};

export function ClaimForm({ id, buttonVariant, className }: ClaimFormProps) {
  return (
    <form
      action="/sign-up"
      method="get"
      className={`flex flex-wrap items-stretch gap-2 ${className ?? ""}`}
    >
      <div className="max-w-[340px] flex-[1_1_260px] max-sm:max-w-none max-sm:basis-full">
        <Input
          id={id}
          name="handle"
          label="Choose your username"
          hideLabel
          prefix="linkbase/"
          placeholder="yourname"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
      </div>
      <Button type="submit" variant={buttonVariant} size="lg" className="max-sm:w-full">
        Claim your link
      </Button>
    </form>
  );
}
