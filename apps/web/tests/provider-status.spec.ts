import { test, expect } from "@playwright/test";
import { normalizeFedapayStatus, normalizeFedapayTransactionStatus } from "../lib/fedapay";
import { normalizeFeexpayStatus } from "../lib/feexpay";
import { normalizeIpaymoneyStatus } from "../lib/ipaymoney";

/**
 * Vocabulaire de statuts des passerelles.
 *
 * Une erreur ici ne provoque AUCUNE erreur visible : la vente est encaissée, le
 * statut est mal lu, la commande reste « en attente » pour toujours et le
 * produit n'est jamais livré. C'est arrivé le 2026-08-03 — un encaissement
 * FedaPay était vérifié avec le vocabulaire des VERSEMENTS (« sent »), alors
 * qu'une transaction réussie vaut « approved ». 3 500 FCFA encaissés, rien
 * livré, et rien nulle part pour le signaler.
 */

test("FedaPay : une transaction et un versement n'ont pas le même vocabulaire", () => {
  // Encaissement (transaction).
  expect(normalizeFedapayTransactionStatus("approved")).toBe("success");
  expect(normalizeFedapayTransactionStatus("transferred")).toBe("success");
  expect(normalizeFedapayTransactionStatus("pending")).toBe("pending");
  expect(normalizeFedapayTransactionStatus("declined")).toBe("failed");
  expect(normalizeFedapayTransactionStatus("canceled")).toBe("failed");
  // Remboursé : l'argent est reparti, ne surtout pas livrer.
  expect(normalizeFedapayTransactionStatus("refunded")).toBe("failed");

  // Versement (payout) — vocabulaire distinct, à ne pas mélanger.
  expect(normalizeFedapayStatus("sent")).toBe("success");

  // Le piège exact : « approved » lu avec le vocabulaire des versements
  // donnait « pending », donc aucune livraison.
  expect(normalizeFedapayStatus("approved")).not.toBe("success");
});

test("FeexPay : statuts d'encaissement", () => {
  expect(normalizeFeexpayStatus("SUCCESSFUL")).toBe("success");
  expect(normalizeFeexpayStatus("FAILED")).toBe("failed");
  expect(normalizeFeexpayStatus("PENDING")).toBe("pending");
});

test("iPay Money : statuts d'encaissement", () => {
  expect(normalizeIpaymoneyStatus("succeeded")).toBe("success");
  expect(normalizeIpaymoneyStatus("failed")).toBe("failed");
  expect(normalizeIpaymoneyStatus("pending")).toBe("pending");
});

test("un statut inconnu ne vaut JAMAIS un succès", () => {
  // Livrer sur un statut qu'on ne comprend pas, c'est offrir le produit.
  for (const inconnu of ["", "wat", "processing", "on_hold", "unknown"]) {
    expect(normalizeFedapayTransactionStatus(inconnu)).not.toBe("success");
    expect(normalizeFeexpayStatus(inconnu)).not.toBe("success");
    expect(normalizeIpaymoneyStatus(inconnu)).not.toBe("success");
  }
});
