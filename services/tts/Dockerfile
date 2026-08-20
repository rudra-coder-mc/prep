# Piper neural text to speech, behind the HTTP server that ships with it.
#
# The voice model is downloaded at build time rather than on first run, so
# `docker compose up` stays the only setup step and the container works with no
# network at all afterwards. Changing the voice means rebuilding this image.
FROM python:3.12-slim

ARG PIPER_VOICE=en_US-lessac-high
ENV PIPER_VOICE=${PIPER_VOICE} \
    PIPER_DATA_DIR=/voices \
    PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir "piper-tts[http]==1.7.0"

RUN python -m piper.download_voices "${PIPER_VOICE}" --download-dir "${PIPER_DATA_DIR}"

EXPOSE 5000

CMD ["sh", "-c", "python -m piper.http_server --host 0.0.0.0 --port 5000 --data-dir \"${PIPER_DATA_DIR}\" --model \"${PIPER_VOICE}\""]
