FROM python:3.10

WORKDIR /app

COPY . .

RUN python3.10 -m pip install --upgrade pip && \
    python3.10 -m pip install -r requirements.txt 
    
# FROM python:3.10

# WORKDIR /app

# # Create and activate a virtual environment
# RUN python3.10 -m venv /opt/venv
# ENV PATH="/opt/venv/bin:$PATH"
# RUN echo "source /opt/venv/bin/activate" >> ~/.bashrc

# COPY . .

# # Install dependencies inside the virtual environment
# RUN pip install --upgrade pip && \
#     pip install -r requirements.txt

# CMD ["python", "-u", "app.py"]