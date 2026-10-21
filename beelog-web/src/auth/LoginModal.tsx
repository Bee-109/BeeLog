import { useEffect, useState, type FormEvent } from "react";
import { LogIn, X } from "lucide-react";
import { useAdminAuth } from "./AuthProvider";

export function LoginModal({ onClose }: { onClose: () => void }) {
  const { status, error, busy, login, clearError } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    clearError();
    // The parent closes the modal after authorization is confirmed.
  }, [clearError]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const authorized = await login(email.trim(), password);
    if (authorized) onClose();
  }

  return (
    <div className="modal-backdrop login-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="create-modal login-modal" onSubmit={submit}>
        <div className="modal-head">
          <div><span className="eyebrow">BEELOG ADMINISTRATION</span><h2>Log in</h2></div>
          <button type="button" className="tiny-icon" onClick={onClose} aria-label="Close login"><X size={18}/></button>
        </div>
        {status === "unconfigured" && <p className="auth-configuration-message">Supabase is not configured. BeeLog is running with mock public data in read-only demo mode. Add the required Supabase environment variables to enable real login.</p>}
        <label>Email<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} maxLength={256} /></label>
        {error && <p className="auth-form-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="dark-button" onClick={onClose}>Cancel</button>
          <button className="gold-button" type="submit" disabled={busy}>{busy ? "Checking…" : <><LogIn size={15}/> Log in</>}</button>
        </div>
      </form>
    </div>
  );
}
