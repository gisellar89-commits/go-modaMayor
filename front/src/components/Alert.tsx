type AlertProps = { message: string };

export default function Alert({ message }: AlertProps) {
  return <div>{message}</div>;
}
