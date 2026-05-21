import { useState } from "react";

interface Props {
  uri: string | null;
  name: string;
  className?: string;
}

export default function CardImage({ uri, name, className = "" }: Props) {
  const [err, setErr] = useState(false);
  if (!uri || err) {
    return (
      <div className={`bg-gray-700 flex items-center justify-center text-gray-400 text-xs text-center p-2 ${className}`}>
        {name}
      </div>
    );
  }
  return <img src={uri} alt={name} className={className} onError={() => setErr(true)} />;
}
