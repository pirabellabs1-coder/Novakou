/**
 * Détection des fichiers DANGEREUX envoyés par les vendeurs (produits
 * numériques livrés aux acheteurs).
 *
 * Novakou ne peut pas exécuter d'antivirus sur Vercel. Mais la quasi-totalité
 * des logiciels malveillants distribués « en produit numérique » sont des
 * exécutables ou des scripts, souvent cachés dans une archive ZIP : on les
 * refuse à l'entrée, par EXTENSION et par SIGNATURE binaire (un .pdf qui
 * commence par « MZ » est un .exe renommé), et on inspecte le sommaire des
 * ZIP sans les décompresser (lecture du répertoire central, jamais d'extraction
 * → aucune « zip bomb » possible).
 *
 * Ce n'est pas un antivirus : un PDF ou un document piégé passe. C'est la
 * barrière qui coûte le moins et arrête le plus.
 */

const EXTENSIONS_INTERDITES = new Set([
  // Windows
  "exe", "dll", "msi", "msp", "scr", "com", "pif", "bat", "cmd", "ps1", "psm1", "vbs", "vbe",
  "js", "jse", "wsf", "wsh", "hta", "cpl", "msc", "reg", "inf", "lnk", "gadget", "appx", "msix",
  // macOS / Linux
  "app", "dmg", "pkg", "command", "sh", "bash", "zsh", "run", "bin", "elf", "deb", "rpm", "appimage",
  // Mobile
  "apk", "xapk", "aab", "ipa",
  // Java / images disque
  "jar", "iso", "img", "vhd", "vhdx",
  // Documents Office AVEC macros
  "docm", "dotm", "xlsm", "xltm", "pptm", "potm",
]);

const ARCHIVES = new Set(["zip", "rar", "7z", "tar", "gz", "tgz", "bz2", "xz"]);

export interface Verdict {
  bloque: boolean;
  motif?: string;
}

function extension(nom: string): string {
  const m = nom.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

/** Signature binaire d'un exécutable, quel que soit le nom du fichier. */
function estExecutable(buf: Uint8Array): string | null {
  if (buf.length < 4) return null;
  if (buf[0] === 0x4d && buf[1] === 0x5a) return "exécutable Windows (PE)";
  if (buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46) return "exécutable Linux (ELF)";
  const u32 = (buf[0] << 24) | (buf[1] << 16) | (buf[2] << 8) | buf[3];
  if ([0xfeedface, 0xfeedfacf, 0xcefaedfe, 0xcffaedfe, 0xcafebabe].includes(u32 >>> 0)) return "exécutable macOS (Mach-O)";
  if (buf[0] === 0x23 && buf[1] === 0x21) return "script (#!)";
  return null;
}

/**
 * Noms des entrées d'un ZIP, lus dans le répertoire central (fin du fichier).
 * Renvoie null si le fichier n'est pas un ZIP lisible.
 */
export function entreesZip(buf: Uint8Array): string[] | null {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  // EOCD : signature 0x06054b50, dans les 65 557 derniers octets.
  const minEocd = Math.max(0, buf.length - 65_557);
  let eocd = -1;
  for (let i = buf.length - 22; i >= minEocd; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) return null;
  let nb = dv.getUint16(eocd + 10, true);
  let taille = dv.getUint32(eocd + 12, true);
  let debut = dv.getUint32(eocd + 16, true);
  // ZIP64 : les champs valent 0xFFFF / 0xFFFFFFFF, le vrai EOCD est ailleurs.
  if (nb === 0xffff || taille === 0xffffffff || debut === 0xffffffff) {
    const loc = eocd - 20;
    if (loc < 0 || dv.getUint32(loc, true) !== 0x07064b50) return null;
    const eocd64 = Number(dv.getBigUint64(loc + 8, true));
    if (eocd64 + 56 > buf.length || dv.getUint32(eocd64, true) !== 0x06064b50) return null;
    nb = Number(dv.getBigUint64(eocd64 + 32, true));
    taille = Number(dv.getBigUint64(eocd64 + 40, true));
    debut = Number(dv.getBigUint64(eocd64 + 48, true));
  }
  if (debut + taille > buf.length) return null;
  const noms: string[] = [];
  let p = debut;
  const decodeur = new TextDecoder("utf-8", { fatal: false });
  for (let i = 0; i < nb && p + 46 <= buf.length; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const lNom = dv.getUint16(p + 28, true);
    const lExtra = dv.getUint16(p + 30, true);
    const lComm = dv.getUint16(p + 32, true);
    noms.push(decodeur.decode(buf.subarray(p + 46, p + 46 + lNom)));
    p += 46 + lNom + lExtra + lComm;
  }
  return noms;
}

/**
 * Verdict sur un fichier envoyé. `nom` = nom d'origine, `buf` = contenu.
 */
export function analyserFichier(nom: string, buf: Uint8Array): Verdict {
  const ext = extension(nom);
  if (EXTENSIONS_INTERDITES.has(ext)) {
    return { bloque: true, motif: `Les fichiers .${ext} (exécutables, scripts, installeurs) ne sont pas acceptés.` };
  }
  const exe = estExecutable(buf);
  if (exe) return { bloque: true, motif: `Ce fichier est un ${exe}, quel que soit son nom.` };

  if (ext === "zip" || (buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04)) {
    const entrees = entreesZip(buf);
    if (!entrees) return { bloque: true, motif: "Archive ZIP illisible ou corrompue." };
    for (const e of entrees) {
      const nomEntree = e.replace(/\\/g, "/");
      if (nomEntree.endsWith("/")) continue; // dossier
      const extE = extension(nomEntree);
      if (EXTENSIONS_INTERDITES.has(extE)) {
        return { bloque: true, motif: `L'archive contient « ${nomEntree.split("/").pop()} » : les fichiers .${extE} ne sont pas acceptés, même dans un ZIP.` };
      }
      if (ARCHIVES.has(extE)) {
        return { bloque: true, motif: `L'archive contient une autre archive (« ${nomEntree.split("/").pop()} ») : impossible à vérifier. Mettez vos fichiers directement dans un seul ZIP.` };
      }
      if (nomEntree.includes("../") || nomEntree.startsWith("/")) {
        return { bloque: true, motif: "L'archive contient des chemins invalides." };
      }
    }
  }
  return { bloque: false };
}
