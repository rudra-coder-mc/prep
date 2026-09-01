"""HTTP speech engine: text in, Ogg Opus out.

Piper only writes WAV, and a WAV of 22 kHz speech is about 44 KB per second,
which is an order of magnitude more than a phone should hold. Compression
happens here rather than in the app because this is where audio is made, and
because it keeps the encoder out of the app image. See
docs/decisions/0036-recordings-are-stored-compressed.md.

This replaces `piper.http_server`, which serves WAV and cannot be told
otherwise. It speaks the two endpoints the platform uses and the one the
healthcheck does, and nothing to do with downloading voices: the voice is baked
into the image at build time.
"""

import io
import logging
import os
import subprocess
import threading
import wave
from pathlib import Path

from flask import Flask, Response, request
from piper import PiperVoice

BITRATE = "32"
"""Kilobits per second, mono. Opus is transparent on 22 kHz speech here."""

SYNTHESIS = threading.Lock()
"""One synthesis at a time, whoever is asking.

Flask serves requests on a thread each, and every one of them runs inference on
the same voice. Nothing about that is unsafe, but the memory is: one sentence of
the length this curriculum writes costs about four hundred megabytes while it is
being decoded, and concurrent requests each want their own. Four at once is
enough to exhaust a container that serves one of them with room to spare, and
the engine does not survive it. See
docs/decisions/0046-the-speech-engine-synthesises-one-at-a-time.md.

The caller is not the place to fix this. A recording is asked for by a reader
pressing play, by a page warming the section it expects to need next, and by
`npm run narration:build` recording a whole track, and none of them knows about
the others.
"""

LOGGER = logging.getLogger(__name__)


def encode(wav: bytes) -> bytes:
    """Turns a WAV into Ogg Opus with opusenc, which does this one job."""
    result = subprocess.run(
        ["opusenc", "--quiet", "--bitrate", BITRATE, "--downmix-mono", "-", "-"],
        input=wav,
        capture_output=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"opusenc failed: {result.stderr.decode('utf-8', 'replace')}")
    return result.stdout


def voice_path() -> Path:
    name = os.environ.get("PIPER_VOICE", "en_US-lessac-high")
    path = Path(os.environ.get("PIPER_DATA_DIR", "/voices")) / f"{name}.onnx"
    if not path.exists():
        raise FileNotFoundError(f"No voice at {path}. Rebuild the image.")
    return path


def create_app() -> Flask:
    # Loaded before the first request rather than lazily, so a container that is
    # up is a container that can speak. The healthcheck's start period covers
    # this.
    path = voice_path()
    voice = PiperVoice.load(path)
    LOGGER.info("Loaded voice %s", path)

    app = Flask(__name__)

    @app.get("/info")
    def info() -> dict:
        """What the compose healthcheck asks for, and the only thing it needs."""
        return {
            "voice": {"name": path.stem, "language": voice.config.espeak_voice},
            "format": {"container": "ogg", "codec": "opus", "bitrate_kbps": int(BITRATE)},
        }

    @app.post("/synthesize")
    def synthesize() -> Response:
        text = (request.get_json(silent=True) or {}).get("text", "").strip()
        if not text:
            return Response('{"error":"No text provided"}', status=400, mimetype="application/json")

        buffer = io.BytesIO()
        # Held for the inference and released before encoding, which costs a
        # subprocess and a few megabytes rather than the model's working set.
        with SYNTHESIS, wave.open(buffer, "wb") as wav_file:
            voice.synthesize_wav(text, wav_file)

        return opus(encode(buffer.getvalue()))

    @app.post("/transcode")
    def transcode() -> Response:
        """A WAV in the body, the same speech as Opus in the reply.

        This is how a cache full of WAV recordings becomes a cache of Opus ones
        without re-synthesising 23 hours of speech. Every key is a hash of the
        script rather than of the bytes, so the format changes underneath the
        keys and none of them move.
        """
        if not request.data:
            return Response('{"error":"No audio provided"}', status=400, mimetype="application/json")
        return opus(encode(request.data))

    return app


def opus(audio: bytes) -> Response:
    return Response(audio, mimetype="audio/ogg")


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    create_app().run(host="0.0.0.0", port=5000)


if __name__ == "__main__":
    main()
