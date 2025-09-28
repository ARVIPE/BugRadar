# agent/agent.py
import docker
import time

# Palabras clave que indican un error
ERROR_KEYWORDS = ["error", "exception", "traceback", "failed", "critical"]

def connect_to_docker():
    """Se conecta al daemon de Docker."""
    try:
        # Intenta conectarse usando la configuración por defecto (socket local)
        client = docker.from_env()
        # Comprueba si la conexión funciona
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

def monitor_logs(container):
    """Monitoriza los logs de un contenedor en tiempo real."""
    print(f"\n🚀 Empezando a monitorizar los logs de '{container.name}' en tiempo real...")
    print(" (Pulsa Ctrl+C para detener)")

    # Obtenemos los logs en streaming (en vivo)
    try:
        for log_line in container.logs(stream=True, follow=True, tail=10):
            line = log_line.decode('utf-8').strip()
            print(f"  [LOG] {line}")

            # Comprobamos si la línea contiene alguna palabra clave de error
            if any(keyword in line.lower() for keyword in ERROR_KEYWORDS):
                print(f"  🐞 ¡ERROR DETECTADO! -> {line}")
                # Aquí es donde, en el futuro, enviaremos el error a la API
                # send_error_to_api(line)

    except KeyboardInterrupt:
        print("\n🛑 Monitorización detenida por el usuario.")
    except Exception as e:
        print(f"\n❌ Ha ocurrido un error durante la monitorización: {e}")

if __name__ == "__main__":
    docker_client = connect_to_docker()
    if docker_client:
        selected_container = select_container(docker_client)
        if selected_container:
            monitor_logs(selected_container)