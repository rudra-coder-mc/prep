# Piper neural text to speech, behind the HTTP server that ships with it.
#
# The voice model is downloaded at build time rather than on first run, so the
# container works with no network at all afterwards. Changing the voice means
# rebuilding this image.
#
# This is not part of the default compose set. It is started by
# `npm run narration:build` and stopped again when that finishes, so it is built
# the first time narration is recorded rather than the first time the platform
# is started. See docs/decisions/0020-the-speech-engine-runs-on-demand.md.
FROM python:3.12-slim

ARG PIPER_VOICE=en_US-lessac-high
ENV PIPER_VOICE=${PIPER_VOICE} \
    PIPER_DATA_DIR=/voices \
    PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir "piper-tts[http]==1.7.0"

RUN python -m piper.download_voices "${PIPER_VOICE}" --download-dir "${PIPER_DATA_DIR}"

EXPOSE 5000

# exec, so python replaces the shell and is the process that receives the stop
# signal. compose sends SIGINT rather than SIGTERM for the reason recorded in
# compose.yaml; with a shell sitting in front, neither one reaches the server.
CMD ["sh", "-c", "exec python -m piper.http_server --host 0.0.0.0 --port 5000 --data-dir \"${PIPER_DATA_DIR}\" --model \"${PIPER_VOICE}\""]
