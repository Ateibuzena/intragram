#!/bin/bash

##############################################
# Script de Inicialización de Base de Datos
# Microservicio: Example
# Base de datos: SQLite (demo)
##############################################

DB_PATH="${DB_PATH:-./db/example.db}"
DB_DIR="$(dirname "$DB_PATH")"

echo "🗄️  Inicializando base de datos Example..."

# Crear directorio si no existe
mkdir -p "$DB_DIR"

# Verificar si SQLite está instalado
if ! command -v sqlite3 &> /dev/null; then
    echo "⚠️  SQLite3 no está instalado. Instalando..."
    # En producción usarías PostgreSQL/MySQL
    apt-get update && apt-get install -y sqlite3 || true
fi

# Crear o resetear la base de datos
if [ -f "$DB_PATH" ]; then
    echo "📦 Base de datos existente encontrada: $DB_PATH"
    read -p "¿Deseas resetear la base de datos? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm "$DB_PATH"
        echo "🗑️  Base de datos eliminada"
    else
        echo "✅ Usando base de datos existente"
        exit 0
    fi
fi

# Crear tabla de ejemplos
echo "📝 Creando tablas..."

sqlite3 "$DB_PATH" <<EOF
-- Tabla de ejemplos
CREATE TABLE IF NOT EXISTS examples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_examples_category ON examples(category);
CREATE INDEX IF NOT EXISTS idx_examples_created_at ON examples(created_at);

-- Datos de ejemplo (seed)
INSERT INTO examples (name, description, category) VALUES
    ('Ejemplo 1', 'Este es el primer ejemplo de prueba', 'demo'),
    ('Ejemplo 2', 'Segundo ejemplo con categoría', 'tutorial'),
    ('Ejemplo 3', 'Tercer ejemplo sin categoría', NULL);

EOF

if [ $? -eq 0 ]; then
    echo "✅ Base de datos creada exitosamente en: $DB_PATH"
    echo "📊 Datos de ejemplo insertados"
    
    # Mostrar contenido
    echo ""
    echo "📋 Contenido actual de la base de datos:"
    sqlite3 "$DB_PATH" "SELECT * FROM examples;"
else
    echo "❌ Error al crear la base de datos"
    exit 1
fi

echo ""
echo "🎉 ¡Inicialización completa!"
echo ""
echo "💡 Comandos útiles:"
echo "  - Ver datos: sqlite3 $DB_PATH 'SELECT * FROM examples;'"
echo "  - Abrir BD: sqlite3 $DB_PATH"
echo "  - Resetear: rm $DB_PATH && $0"
