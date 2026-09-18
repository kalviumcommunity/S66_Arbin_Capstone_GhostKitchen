import { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_ID = "google-identity-services";

export default function GoogleLoginButton({ onSuccess, disabled = false }) {
  const buttonRef = useRef(null);
  const onSuccessRef = useRef(onSuccess);
  const [error, setError] = useState("");
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (!clientId) {
      setError("Google login is not configured for this environment.");
      return undefined;
    }

    const renderButton = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onSuccessRef.current(response.credential),
      });
      buttonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: Math.min(buttonRef.current.clientWidth || 320, 400),
        text: "continue_with",
      });
    };

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    if (window.google?.accounts?.id) {
      renderButton();
      return undefined;
    }

    const script = existingScript || document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", renderButton);
    if (!existingScript) document.head.appendChild(script);

    return () => script.removeEventListener("load", renderButton);
  }, [clientId]);

  if (!clientId) return <p className="text-center text-xs text-slate-500">{error}</p>;

  return (
    <div className={`w-full ${disabled ? "pointer-events-none opacity-60" : ""}`}>
      <div ref={buttonRef} className="flex min-h-10 w-full justify-center" aria-label="Continue with Google" />
      {error ? <p className="mt-2 text-center text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
