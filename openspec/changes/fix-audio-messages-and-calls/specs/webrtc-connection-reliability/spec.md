## ADDED Requirements

### Requirement: Faster signaling polling during active calls
During an active call (from offer sent/received until hangup), the signaling polling interval SHALL be 200ms instead of the current 500ms.

#### Scenario: Caller initiates a call
- **WHEN** a call offer is sent
- **THEN** the signaling polling interval SHALL switch to 200ms
- **AND** the interval SHALL remain at 200ms until the call ends

#### Scenario: Call ends
- **WHEN** hangup is triggered (by either party)
- **THEN** the signaling polling interval SHALL revert to 3000ms (idle)

### Requirement: Immediate poll after answer received
When the caller receives an answer signal, the system SHALL immediately trigger a signaling poll to fetch pending ICE candidates without waiting for the next polling interval.

#### Scenario: Caller receives answer from callee
- **WHEN** the caller's signaling handler receives an `answer` signal
- **AND** sets the remote description on the RTCPeerConnection
- **THEN** the system SHALL immediately call `pollServer()` to fetch buffered ICE candidates
- **AND** continue the regular 200ms polling cycle

### Requirement: Extended ICE failure timeout
When the RTCPeerConnection enters `connectionState: "failed"`, the system SHALL wait 15 seconds (not 5 seconds) before triggering automatic hangup.

#### Scenario: ICE connection fails temporarily
- **WHEN** the RTCPeerConnection state becomes `"failed"`
- **THEN** the system SHALL call `restartIce()`
- **AND** wait 15 seconds
- **THEN** if the state is still `"failed"`, trigger automatic hangup

#### Scenario: ICE recovers within timeout
- **WHEN** the RTCPeerConnection state becomes `"failed"`
- **AND** the system calls `restartIce()`
- **AND** within 15 seconds the state transitions to `"connected"`
- **THEN** the system SHALL NOT trigger hangup
- **AND** the call SHALL continue normally

### Requirement: ICE connection state monitoring
The system SHALL monitor `iceConnectionState` on the RTCPeerConnection in addition to `connectionState`, and log state transitions for diagnostic purposes.

#### Scenario: ICE state transitions during call setup
- **WHEN** the RTCPeerConnection is created
- **THEN** the system SHALL register an `oniceconnectionstatechange` handler
- **AND** log each transition with format: `[WebRTC] ICE state: {previousState} → {newState}`

#### Scenario: ICE enters checking state
- **WHEN** `iceConnectionState` transitions to `"checking"`
- **THEN** the system SHALL log `[WebRTC] ICE state: new → checking`
- **AND** the UI callState SHALL remain in `"connecting"`

### Requirement: TURN server connectivity check
Before initiating a call, the system SHALL verify TURN server connectivity using a lightweight probe. A TURN failure SHALL NOT block the call but SHALL be logged.

#### Scenario: TURN servers are reachable
- **WHEN** the user initiates a call
- **THEN** the system SHALL create an ephemeral RTCPeerConnection with `iceTransportPolicy: "relay"`
- **AND** wait up to 3 seconds for a relay ICE candidate
- **AND** if a relay candidate is received, log `[WebRTC] TURN server OK`
- **AND** close the ephemeral connection
- **AND** proceed with the call normally

#### Scenario: TURN servers are unreachable
- **WHEN** the user initiates a call
- **AND** the TURN probe receives no relay candidate within 3 seconds
- **THEN** the system SHALL log `[WebRTC] TURN server unreachable — STUN only`
- **AND** proceed with the call using STUN only (may fail behind symmetric NAT)
- **AND** the call SHALL NOT be blocked

### Requirement: Structured call diagnostic logging
All WebRTC-related log messages SHALL include structured information to aid debugging.

#### Scenario: Call completes successfully
- **WHEN** a call connects and then ends normally
- **THEN** the logs SHALL include:
  - `[WebRTC] Call initiated: {callId}, type: {audio|video}`
  - `[WebRTC] ICE candidates sent: {count}`
  - `[WebRTC] ICE candidates received: {count}`
  - `[WebRTC] Connection established in {ms}ms`
  - `[WebRTC] Call ended: duration {seconds}s`

#### Scenario: Call fails to connect
- **WHEN** a call is initiated but fails to connect
- **THEN** the logs SHALL include:
  - `[WebRTC] Call initiated: {callId}, type: {audio|video}`
  - `[WebRTC] ICE candidates sent: {count}`
  - `[WebRTC] ICE candidates received: {count}`
  - `[WebRTC] Connection FAILED after {ms}ms — state: {connectionState}, iceState: {iceConnectionState}`
