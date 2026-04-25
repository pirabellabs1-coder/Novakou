/**
 * WebRTC signaling stub — kept for messaging call components.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export function sendOffer(_socketRef: any, _data: any) {}
export function sendAnswer(_socketRef: any, _data: any) {}
export function sendIceCandidate(_socketRef: any, _data: any) {}
export function sendCallEnd(_socketRef: any, _data: any) {}
export function sendCallReject(_socketRef: any, _data: any) {}
export function onOffer(_socketRef: any, _cb: any) { return () => {} }
export function onAnswer(_socketRef: any, _cb: any) { return () => {} }
export function onIceCandidate(_socketRef: any, _cb: any) { return () => {} }
export function onCallEnd(_socketRef: any, _cb: any) { return () => {} }
export function onCallReject(_socketRef: any, _cb: any) { return () => {} }
