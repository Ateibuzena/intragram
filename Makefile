.PHONY: all build up down clean fclean re refresh

COMPOSE = docker compose -f docker-compose.yml

# ---------------------------
# Main rule: build + up
all: up

# ---------------------------
# Build all images with docker-compose
build:
	@echo "🐳 Building all images..."
	@$(COMPOSE) build

# ---------------------------
# Start containers
up:
	@echo "🐳 Lifting containers..."
	@$(COMPOSE) up -d

# ---------------------------
# Stop containers
down:
	@echo "🐳 Shutting down containers..."
	@$(COMPOSE) down

# ---------------------------
# ---------------------------
# Clean containers, volumes, networks, and data
clean:
	@echo "🧹 Starting cleanup process..."
	@echo "🚫 Stopping containers..."
	-@docker stop $$(docker ps -aq) 2>/dev/null || echo "❎ No containers running."
	@echo "🗑️ Removing containers..."
	-@docker rm -f $$(docker ps -aq) 2>/dev/null || echo "❎ No containers to remove."
	@echo "📦 Removing Docker volumes..."
	-@docker volume rm $$(docker volume ls -q) 2>/dev/null || echo "❎ No volumes to remove."
	@echo "🌐 Removing custom networks..."
	-@docker network rm $$(docker network ls -q | grep -vE "bridge|host|none") 2>/dev/null || echo "❎ No custom networks to remove."
	@echo "✨ Clean completed!"

# ---------------------------
# Remove absolutely everything (images, containers, volumes)
fclean: clean
	@echo "⚠️ Deep cleaning Docker system..."
	@echo "🖼️ Removing Docker images..."
	-@docker rmi -f $$(docker images -q) 2>/dev/null || echo "❎ No images to delete."
	@echo "🧨 Running system prune (everything, including volumes)..."
	-@docker system prune -af --volumes
	@echo "🧹 Full cleanup completed successfully!"


# ---------------------------
# Rebuild and lift everything from scratch
re: fclean all

# ---------------------------
# Restart containers without rebuilding
refresh:
	@echo "🐳 Restarting containers..."
	@if [ -n "$$(docker ps -q)" ]; then \
		docker restart $$(docker ps -q); \
	else \
		echo "❎ No containers running to restart."; \
	fi