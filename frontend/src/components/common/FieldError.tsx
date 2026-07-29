interface FieldErrorProps {
  error?: string | null;
}

/**
 * Displays an error message below a form field
 */
export default function FieldError({ error }: FieldErrorProps) {
  if (!error) return null;

  return (
    <span className="field-error">{error}</span>
  );
}
