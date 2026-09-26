import { CircleAlert, CircleCheck, Info } from "lucide-react";

interface AuthAlertProps {
  type: "error" | "success" | "info";
  titre?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}

const ICONES = { error: CircleAlert, success: CircleCheck, info: Info } as const;

/** Bandeau d'état du formulaire. Les erreurs sont annoncées (role="alert"). */
export function AuthAlert({ type, titre, children, id }: AuthAlertProps) {
  const Icone = ICONES[type];
  return (
    <div
      id={id}
      role={type === "error" ? "alert" : "status"}
      className={`nkauth-alert nkauth-alert--${type}`}
      data-reveal="fade"
    >
      <Icone aria-hidden="true" />
      <div>
        {titre && <b>{titre}</b>}
        {children}
      </div>
    </div>
  );
}
