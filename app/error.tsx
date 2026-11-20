"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2 text-white">
      <h2>Da ist etwas schiefgelaufen.</h2>
      <button className="underline" onClick={() => reset()}>
        Nochmal versuchen
      </button>
    </div>
  );
}
