import { Check, Play, PlayCircle, Send } from "lucide-react";

/**
 * Visuels abstraits des cartes de fonctionnalités : du HTML/CSS léger
 * (public.css, `.nkp-vis-*`), aucune image. Tous décoratifs pour les
 * lecteurs d'écran ; le texte des cartes porte l'information.
 */

function Barre({ url }: { url: string }) {
  return (
    <div className="nkp-vis__bar">
      <i />
      <i />
      <i />
      <span className="url">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
        {url}
      </span>
    </div>
  );
}

export function VisuelBoutique() {
  return (
    <div className="nkp-vis nkp-vis-shop" aria-hidden="true">
      <Barre url="aminata.novakou.com" />
      <div className="nkp-vis__body">
        <div className="hero">
          <small>Formation phare</small>
          <b>Maîtriser le marketing digital</b>
          <p>De débutant à expert en 6 modules pratiques.</p>
        </div>
        <div className="grid">
          <div className="item">
            <div className="th" />
            <b>Excel avancé</b>
            <small>15 000 F</small>
          </div>
          <div className="item">
            <div className="th b" />
            <b>Pack templates Canva</b>
            <small>8 000 F</small>
          </div>
          <div className="item">
            <div className="th c" />
            <b>E-book : vendre en ligne</b>
            <small>Gratuit</small>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VisuelTunnel() {
  return (
    <div className="nkp-vis" aria-hidden="true">
      <Barre url="novakou.com/f/marketing-30-jours" />
      <div className="nkp-vis__body nkp-vis-funnel">
        <div className="bar f1">
          Visiteurs<small>1 248</small>
        </div>
        <div className="down">↓ 49 %</div>
        <div className="bar f2">
          Page de capture<small>612</small>
        </div>
        <div className="down">↓ 6 %</div>
        <div className="bar f3">
          Achats<small>37</small>
        </div>
        <div className="nkp-vis-note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          Version B gagnante : +18 % de conversion
        </div>
      </div>
    </div>
  );
}

export function VisuelPaiement() {
  return (
    <div className="nkp-vis nkp-vis-pay" aria-hidden="true">
      <Barre url="Paiement sécurisé · 15 000 F" />
      <div className="nkp-vis__body">
        <div className="row on">
          <div className="b wave">WAVE</div>
          <div className="m">
            <b>Wave Mobile Money</b>
            <small>Paiement en un geste</small>
          </div>
          <span className="radio" />
        </div>
        <div className="row">
          <div className="b om">OM</div>
          <div className="m">
            <b>Orange Money</b>
            <small>Code USSD ou application</small>
          </div>
          <span className="radio" />
        </div>
        <div className="row">
          <div className="b mtn">MTN</div>
          <div className="m">
            <b>MTN MoMo</b>
            <small>Confirmation par SMS</small>
          </div>
          <span className="radio" />
        </div>
        <div className="row">
          <div className="b cb">CB</div>
          <div className="m">
            <b>Carte bancaire</b>
            <small>Visa, Mastercard</small>
          </div>
          <span className="radio" />
        </div>
        <div className="nkp-vis-cta">Payer 15 000 F</div>
      </div>
    </div>
  );
}

export function VisuelIA() {
  return (
    <div className="nkp-vis nkp-vis-ai" aria-hidden="true">
      <Barre url="Novakou IA · en ligne" />
      <div className="nkp-vis__body">
        <div className="msg user">Génère un plan pour une formation sur le marketing digital en Afrique.</div>
        <div className="msg bot">
          <b>Bien sûr.</b> Voici 4 modules adaptés à votre marché :
          <ol>
            <li>Fondamentaux et réseaux sociaux locaux</li>
            <li>Créer une offre irrésistible</li>
            <li>Publicité à petit budget</li>
            <li>Closing et fidélisation</li>
          </ol>
        </div>
        <div className="input">
          <span>Posez votre question…</span>
          <span className="send">
            <Send strokeWidth={2} />
          </span>
        </div>
      </div>
    </div>
  );
}

export function VisuelVideo() {
  return (
    <div className="nkp-vis nkp-vis-video" aria-hidden="true">
      <div className="nkp-vis__body">
        <div className="player">
          <span className="badge">HD · 720p</span>
          <span className="play">
            <Play strokeWidth={2} fill="currentColor" />
          </span>
          <div className="prog">
            <i />
            <span>12:45</span>
          </div>
        </div>
        <div className="chap">
          <Check strokeWidth={2.4} />
          <span>Module 1 — Introduction</span>
          <small>12:45</small>
        </div>
        <div className="chap">
          <Check strokeWidth={2.4} />
          <span>Module 2 — Les fondamentaux</span>
          <small>18:20</small>
        </div>
        <div className="chap todo">
          <PlayCircle strokeWidth={2} />
          <span>Module 3 — Mise en pratique</span>
          <small>25:10</small>
        </div>
      </div>
    </div>
  );
}

export function VisuelFlux() {
  const flux = [
    ["Bienvenue nouvel apprenant", "247 déclenchements"],
    ["Relance panier abandonné", "89 récupérés"],
    ["Certificat de fin de formation", "134 envoyés"],
    ["Offre post-achat (upsell)", "31 conversions"],
  ];
  return (
    <div className="nkp-vis nkp-vis-flow" aria-hidden="true">
      <Barre url="Centre d'automatisation" />
      <div className="nkp-vis__body">
        {flux.map(([l, n]) => (
          <div key={l} className="row">
            <span className="dot" />
            <div className="m">
              <b>{l}</b>
              <small>{n}</small>
            </div>
            <span className="st">Actif</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VisuelAffiliation() {
  return (
    <div className="nkp-vis nkp-vis-aff" aria-hidden="true">
      <Barre url="Programme d'affiliation" />
      <div className="nkp-vis__body">
        <div className="stats">
          <div className="stat">
            <b>24</b>
            <small>Affiliés actifs</small>
          </div>
          <div className="stat">
            <b>1 247</b>
            <small>Clics ce mois</small>
          </div>
          <div className="stat">
            <b>87</b>
            <small>Ventes générées</small>
          </div>
          <div className="stat">
            <b>327 500 F</b>
            <small>Commissions payées</small>
          </div>
        </div>
        <div className="link">
          <code>novakou.com/r/votrenom</code>
          <span>Copier</span>
        </div>
      </div>
    </div>
  );
}

export function VisuelRetrait() {
  return (
    <div className="nkp-vis nkp-vis-wallet" aria-hidden="true">
      <div className="nkp-vis__body">
        <div className="bal">
          <small>Solde disponible</small>
          <b>412 000 F</b>
        </div>
        <div className="row">
          <b>Retrait vers Wave</b>
          <small>sous 24 h</small>
        </div>
      </div>
    </div>
  );
}

export function VisuelCertificat() {
  return (
    <div className="nkp-vis" aria-hidden="true">
      <div className="nkp-vis__body">
        <div className="nkp-vis-cert">
          <small>Certificat de réussite</small>
          <b>Aminata Koné</b>
          <p>a terminé « Maîtriser le marketing digital »</p>
          <span className="seal">
            <Check strokeWidth={3} />
          </span>
        </div>
      </div>
    </div>
  );
}

export function VisuelWorkflow() {
  return (
    <div className="nkp-vis nkp-vis-wf" aria-hidden="true">
      <Barre url="Workflow · Relance panier" />
      <div className="nkp-vis__body">
        <div className="node trig">
          <span className="k">Déclencheur</span>
          <b>Panier abandonné</b>
        </div>
        <div className="edge">1 h plus tard</div>
        <div className="node">
          <span className="k">Action</span>
          <b>Email « Vous avez oublié quelque chose »</b>
        </div>
        <div className="edge">si pas d'achat · 24 h plus tard</div>
        <div className="node">
          <span className="k">Action</span>
          <b>SMS + code promo −10 %</b>
        </div>
      </div>
    </div>
  );
}
