interface Props {
  title: string;
  detail: string;
  onRetry: () => void;
}

export function ErrorMessage({ title, detail, onRetry }: Props) {
  return (
    <div className="screen">
      <h1 className="error">{title}</h1>
      <p>{detail}</p>
      <button className="btn" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
