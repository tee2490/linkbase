type FormErrorProps = {
  message?: string;
};

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return (
    <p role="alert" className="m-0 rounded-sm bg-surface-muted px-4 py-3 text-body-sm text-danger">
      {message}
    </p>
  );
}
