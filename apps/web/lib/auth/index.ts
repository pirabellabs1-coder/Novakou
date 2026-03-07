import { getServerSession } from "next-auth";
import { authOptions } from "./config";

export { authOptions };

/** Helper pour récupérer la session côté serveur */
export function auth() {
  return getServerSession(authOptions);
}
