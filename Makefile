.PHONY: all build up down clean fclean re refresh

COMPOSE = docker compose -f docker-compose.dev.yml

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
# Clean only this Compose project images
clean:
	@echo "🧹 Starting cleanup process..."
	@echo "🖼️ Removing images built by this Compose project..."
	-@docker images --format '{{.Repository}}:{{.Tag}}' | grep '^intragram-' | xargs -r docker rmi -f 2>/dev/null || echo "❎ No project images to remove."
	@echo "✨ Clean completed!"

# ---------------------------
# Remove only project volumes
fclean: down clean
	@echo "⚠️ Deep cleaning Docker system..."
	@echo "📦 Removing project volumes..."
	-@docker volume rm frontend-node-modules gateway-node-modules auth-service-node-modules users-service-node-modules chat-service-node-modules posts-service-node-modules auth-db-data users-db-data chat-db-data posts-db-data grafana-data prometheus-data 2>/dev/null || echo "❎ No project volumes to remove."
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
