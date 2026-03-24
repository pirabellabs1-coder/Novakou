## 1. Fix audio upload validation (messages vocaux)

- [x] 1.1 Add WebM (EBML), OGG, MP4/M4A, and MP3 magic bytes to `MAGIC_BYTES` map in `apps/web/app/api/upload/file/route.ts`. WebM: `[0x1A, 0x45, 0xDF, 0xA3]`, OGG: `[0x4F, 0x67, 0x67, 0x53]`, MP4: `[0x66, 0x74, 0x79, 0x70]` at offset 4, MP3: `[0x49, 0x44, 0x33]` and `[0xFF, 0xFB]`.
- [x] 1.2 Add `ogg`, `m4a`, `mp3` to `ALLOWED_EXTENSIONS` array in the same file.
- [x] 1.3 Update `validateMagicBytes` to support offset-based signatures (MP4 ftyp at offset 4).

## 2. Fix voice recorder MIME type handling

- [x] 2.1 In `apps/web/components/messaging/voice/useVoiceRecorder.ts`, expose the actual `mimeType` selected by MediaRecorder in the hook return value.
- [x] 2.2 In `apps/web/components/messaging/ChatPanel.tsx` `handleVoiceSend`, use the actual MIME type to create the File object with the correct extension (`.webm` for webm, `.m4a` for mp4, `.ogg` for ogg).
- [x] 2.3 Remove the `blob:` URL fallback in `handleVoiceSend`. If upload fails, show a toast error "Erreur lors de l'envoi du message vocal" and do NOT send the message.

## 3. Improve WebRTC signaling speed

- [x] 3.1 In `apps/web/lib/webrtc/signaling.ts`, reduce `POLL_INTERVAL_ACTIVE` from 500ms to 200ms.
- [x] 3.2 Export a `pollServerNow()` function that triggers an immediate poll.
- [x] 3.3 In `apps/web/components/messaging/calls/useWebRTC.ts`, call `pollServerNow()` immediately after `setRemoteDescription` in the `onAnswer` handler.

## 4. Fix WebRTC connection timeout

- [x] 4.1 In `useWebRTC.ts` `createPeerConnection`, increase the `"failed"` state timeout from 5000ms to 15000ms.
- [x] 4.2 Add `oniceconnectionstatechange` handler to log ICE state transitions: `[WebRTC] ICE state: {state}`.
- [x] 4.3 Add ICE candidate counters (sent/received) and log them on call end or failure.

## 5. Add TURN server validation

- [x] 5.1 Create a `checkTurnConnectivity()` function in `apps/web/lib/webrtc/media.ts` that tests TURN relay by creating an ephemeral RTCPeerConnection with `iceTransportPolicy: "relay"` and checking for relay candidates within 3s.
- [x] 5.2 Call `checkTurnConnectivity()` at the start of `initiateCall` in `useWebRTC.ts`. Log result but do not block the call.

## 6. Test and verify

- [ ] 6.1 (MANUAL) Test voice message recording and playback: record → send → refresh page → play on sender side → verify playback on receiver side.
- [ ] 6.2 (MANUAL) Test audio call: initiate → answer → verify audio flows both ways → verify call duration timer → hangup.
- [ ] 6.3 (MANUAL) Test video call: initiate → answer → verify video and audio → hangup.
- [ ] 6.4 (MANUAL) Check browser console for new diagnostic logs during call setup.
