# agent/agent.py
import docker
import time
import requests
import json

# Palabras clave que indican un error o una advertencia
ERROR_KEYWORDS = ["error", "exception", "traceback", "failed", "critical"]
WARNING_KEYWORDS = ["warning", "warn", "deprecated"]

# URL del endpoint de la API
API_URL = "http://localhost:3000/api/logs"

def get_severity(log_line):
    """Determina la severidad de un log."""
    line_lower = log_line.lower()
    if any(keyword in line_lower for keyword in ERROR_KEYWORDS):
        return "error"
    if any(keyword in line_lower for keyword in WARNING_KEYWORDS):
        return "warning"
    return "info"

def send_log_to_api(log_message, container_name, severity, user_id):
    """Envía un log al dashboard a través de la API."""
    payload = {
        "log_message": log_message,
        "container_name": container_name,
        "severity": severity,
        "user_id": user_id
    }
    try:
        response = requests.post(API_URL, json=payload)
        if response.status_code == 201:
            print(f"  ✅ Log enviado con éxito al dashboard.")
        else:
            print(f"  ❌ Error al enviar el log: {response.status_code} - {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"  ❌ Error de conexión al enviar el log: {e}")

def connect_to_docker():
    """Se conecta al daemon de Docker."""
    try:
        client = docker.from_env()
        client.ping()
        print("✅ Conexión con Docker establecida con éxito.")
        return client
    except docker.errors.DockerException as e:
        print(f"❌ Error al conectar con Docker: {e}")
        print("Asegúrate de que Docker Desktop (o el daemon de Docker) se está ejecutando.")
        return None

def select_container(client):
    """Muestra los contenedores en ejecución y permite al usuario elegir uno."""
    running_containers = client.containers.list()
    if not running_containers:
        print("No hay contenedores en ejecución.")
        return None

    print("\nContenedores en ejecución:")
    for i, container in enumerate(running_containers):
        print(f"  [{i}] {container.name} ({container.short_id})")

    while True:
        try:
            choice = int(input("\nSelecciona el número del contenedor a monitorizar: "))
            if 0 <= choice < len(running_containers):
                return running_containers[choice]
            else:
                print("Selección inválida. Inténtalo de nuevo.")
        except ValueError:
            print("Por favor, introduce un número.")

def monitor_logs(container, user_id):
    """Monitoriza los logs de un contenedor en tiempo real y los envía a la API."""
    print(f"\n🚀 Empezando a monitorizar los logs de '{container.name}' en tiempo real...")
    print(" (Pulsa Ctrl+C para detener)")

    try:
        for log_line in container.logs(stream=True, follow=True, tail=10):
            line = log_line.decode('utf-8').strip()
            severity = get_severity(line)
            
            print(f"  [LOG] Severity: {severity} - {line}")

            # Enviar el log a la API
            send_log_to_api(line, container.name, severity, user_id)

    except KeyboardInterrupt:
        print("\n🛑 Monitorización detenida por el usuario.")
    except Exception as e:
        print(f"\n❌ Ha ocurrido un error durante la monitorización: {e}")

if __name__ == "__main__":
    docker_client = connect_to_docker()
    if docker_client:
        selected_container = select_container(docker_client)
        if selected_container:
            user_id = input("\nIntroduce tu ID de usuario para asociar los logs: ")
            monitor_logs(selected_container, user_id)