/**
 * WebRTC signaling stub — kept for messaging call components.
 * Tous les handlers sont des no-ops : la fonctionnalité d'appel vidéo
 * n'est pas activée en MVP. Les imports sont conservés pour que les
 * composants `VideoCallModal` etc. compilent sans crasher.
 */

// Types minimaux : un "socket-like ref" et un payload générique.
// On évite `any` pour passer le lint sans casser les composants appelants.
type SocketLikeRef = { current?: unknown } | null | undefined;
type SignalPayload = Record<string, unknown>;
type SignalCallback = (data: SignalPayload) => void;

// Stubs vides. Les paramètres préfixés `_` sont conservés pour signaler
// l'intention de l'API (lint configuré pour les ignorer).
/* eslint-disable @typescript-eslint/no-unused-vars */
export function sendOffer(_socketRef: SocketLikeRef, _data: SignalPayload) {}
export function sendAnswer(_socketRef: SocketLikeRef, _data: SignalPayload) {}
export function sendIceCandidate(_socketRef: SocketLikeRef, _data: SignalPayload) {}
export function sendCallEnd(_socketRef: SocketLikeRef, _data: SignalPayload) {}
export function sendCallReject(_socketRef: SocketLikeRef, _data: SignalPayload) {}
export function onOffer(_socketRef: SocketLikeRef, _cb: SignalCallback) { return () => {}; }
export function onAnswer(_socketRef: SocketLikeRef, _cb: SignalCallback) { return () => {}; }
export function onIceCandidate(_socketRef: SocketLikeRef, _cb: SignalCallback) { return () => {}; }
export function onCallEnd(_socketRef: SocketLikeRef, _cb: SignalCallback) { return () => {}; }
export function onCallReject(_socketRef: SocketLikeRef, _cb: SignalCallback) { return () => {}; }
