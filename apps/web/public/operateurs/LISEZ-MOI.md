# Logos d'opérateurs

Déposez ici un fichier nommé d'après le **code interne de l'opérateur**, tel
qu'il figure dans `lib/payments/registry.ts` :

    celtiis_bj.png      →  Celtiis Cash (Bénin)
    coris_bj.svg        →  Coris Money (Bénin)
    eu_cm.png           →  Express Union (Cameroun)
    moov_ga.png         →  Moov Africa (Gabon)
    africell_cd.png     →  Africell Money (RD Congo)
    mtn_gn.png          →  MTN Mobile Money (Guinée)
    orange_gn.png       →  Orange Money (Guinée)
    mtn_lr.png          →  Lonestar Cell MTN (Liberia)
    airtel_ne.png       →  Airtel Money (Niger)
    moov_ne.png         →  Moov Money (Niger)
    zamani_ne.png       →  Zamani Money (Niger)
    djamo_ci.png        →  Djamo (Côte d'Ivoire)
    djamo_sn.png        →  Djamo (Sénégal)
    e_money_sn.png      →  E-Money (Sénégal)
    wizall_sn.png       →  Wizall (Sénégal)
    togocel.png         →  Togocel Money (Togo)

Extensions acceptées : `.svg`, `.png`, `.webp` — dans cet ordre.

## Ordre de résolution

1. **Ce dossier** — prioritaire, aucun code à toucher.
2. Le CDN de la passerelle, s'il fournit un logo pour cet opérateur.
3. La pastille dessinée (`OperatorLogo.tsx`), aux couleurs de la marque.

Déposer un fichier ici permet donc aussi de **remplacer** un logo servi par la
passerelle, et de cesser de dépendre d'un tiers sur l'écran de paiement.

Format conseillé : carré, fond transparent ou blanc, 128×128 minimum.
