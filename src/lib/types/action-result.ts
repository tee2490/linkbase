export type ActionResult<TData = null, TField extends string = string> =
  | { status: "idle" }
  | { status: "success"; data: TData }
  | {
      status: "error";
      fieldErrors: Partial<Record<TField, string[]>>;
      formError?: string; // a problem with the form as a whole, not one field
    };
