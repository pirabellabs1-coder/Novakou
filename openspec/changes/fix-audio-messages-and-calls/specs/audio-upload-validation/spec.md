## ADDED Requirements

### Requirement: Upload endpoint accepts audio file formats
The upload endpoint (`/api/upload/file`) SHALL accept audio files in WebM, OGG, MP4, M4A, and MP3 formats by validating their magic bytes correctly.

Magic bytes to recognize:
- **WebM** (EBML): `0x1A, 0x45, 0xDF, 0xA3`
- **OGG**: `0x4F, 0x67, 0x67, 0x53`
- **MP4/M4A**: `0x66, 0x74, 0x79, 0x70` at offset 4 (ftyp box)
- **MP3** (ID3): `0x49, 0x44, 0x33` or MPEG sync `0xFF, 0xFB`

The ALLOWED_EXTENSIONS list SHALL include `ogg`, `m4a`, and `mp3` in addition to existing extensions.

#### Scenario: Upload WebM audio file from Chrome
- **WHEN** a user records a voice message in Chrome (produces `audio/webm;codecs=opus`)
- **AND** the file is uploaded to `/api/upload/file`
- **THEN** the magic bytes validation SHALL pass (EBML header `0x1A 0x45 0xDF 0xA3`)
- **AND** the file SHALL be stored in Supabase Storage bucket `message-attachments`
- **AND** a signed URL SHALL be returned in the response

#### Scenario: Upload MP4 audio file from Safari
- **WHEN** a user records a voice message in Safari (produces `audio/mp4`)
- **AND** the file is uploaded with extension `.m4a` or `.mp4`
- **THEN** the magic bytes validation SHALL pass (ftyp at offset 4)
- **AND** the file SHALL be stored and a signed URL returned

#### Scenario: Upload OGG audio file from Firefox
- **WHEN** a user records a voice message in Firefox (produces `audio/ogg;codecs=opus`)
- **AND** the file is uploaded with extension `.ogg`
- **THEN** the magic bytes validation SHALL pass (OGG header `0x4F 0x67 0x67 0x53`)
- **AND** the file SHALL be stored and a signed URL returned

### Requirement: Voice recorder uses actual MIME type
The voice recorder (`useVoiceRecorder`) SHALL expose the actual MIME type selected by the MediaRecorder API. The `handleVoiceSend` function SHALL create the File object with the real MIME type and a matching file extension.

#### Scenario: Chrome records in WebM format
- **WHEN** the MediaRecorder selects `audio/webm;codecs=opus`
- **THEN** the file SHALL be created with name `voice-{timestamp}.webm` and type `audio/webm`

#### Scenario: Safari records in MP4 format
- **WHEN** the MediaRecorder selects `audio/mp4`
- **THEN** the file SHALL be created with name `voice-{timestamp}.m4a` and type `audio/mp4`

#### Scenario: Firefox records in OGG format
- **WHEN** the MediaRecorder selects `audio/ogg;codecs=opus`
- **THEN** the file SHALL be created with name `voice-{timestamp}.ogg` and type `audio/ogg`

### Requirement: No fallback to blob URLs for voice messages
When the upload of a voice message fails, the system SHALL NOT store a `blob:` URL in the database. Instead, it SHALL display an error notification to the user.

#### Scenario: Upload fails due to network error
- **WHEN** the user sends a voice message
- **AND** the upload to Supabase Storage fails
- **THEN** the system SHALL display a toast/notification: "Erreur lors de l'envoi du message vocal"
- **AND** the message SHALL NOT be sent to the API
- **AND** no `blob:` URL SHALL be stored in the database

#### Scenario: Upload fails due to missing Supabase configuration
- **WHEN** the upload endpoint returns a non-signed URL (local fallback path)
- **THEN** the voice message MAY be sent with the fallback path
- **AND** the system SHALL log a warning about Supabase Storage not being configured
