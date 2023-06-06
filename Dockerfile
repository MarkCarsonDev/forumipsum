FROM python:3.10

WORKDIR /app

COPY . .

RUN pip install --upgrade pip && \
    pip install -r requirements.txt
    # pip install -q datasets loralib sentencepiece && \
    # pip uninstall -y transformers && \
    # pip install -q git+https://github.com/zphang/transformers@c3dc391 && \
    # pip install -q git+https://github.com/huggingface/peft.git && \
    # pip install -q bitsandbytes

# CMD ["uvicorn", "alpaca_api_waypoint:app", "--host", "0.0.0.0", "--port", "8100"]
