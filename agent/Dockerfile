FROM python:3.11-slim
RUN pip install --no-cache-dir docker requests
WORKDIR /app
COPY agent.py /app/agent.py
ENV BUGRADAR_API_URL=http://host.docker.internal:3000/api/logs
ENV BUGRADAR_STATUS_API_URL=http://host.docker.internal:3000/api/status
ENV BUGRADAR_USER_ID=
ENV BUGRADAR_CONTAINERS=
ENV BUGRADAR_TAIL=100
ENV BUGRADAR_PARSE_JSON=1
ENV BUGRADAR_HEARTBEAT_EVERY=60
CMD ["python", "/app/agent.py"]
