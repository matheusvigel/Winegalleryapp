#!/bin/bash
# Script de configuração do ambiente local
# Wine Gallery App - Ambiente local em /users/admin/sites

set -e

PROJECT_NAME="Winegalleryapp"
TARGET_DIR="/users/admin/sites/$PROJECT_NAME"
SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Wine Gallery App - Setup de Ambiente Local ==="
echo "Origem: $SOURCE_DIR"
echo "Destino: $TARGET_DIR"
echo ""

# Criar diretório de destino se não existir
if [ ! -d "$TARGET_DIR" ]; then
  echo "[1/3] Criando diretório $TARGET_DIR..."
  mkdir -p "$TARGET_DIR"
else
  echo "[1/3] Diretório $TARGET_DIR já existe."
fi

# Copiar arquivos do projeto (excluindo node_modules e dist)
echo "[2/3] Copiando arquivos do projeto..."
rsync -av --exclude='node_modules' --exclude='dist' --exclude='.git' \
  "$SOURCE_DIR/" "$TARGET_DIR/"

# Instalar dependências
echo "[3/3] Instalando dependências..."
cd "$TARGET_DIR"
npm install

echo ""
echo "=== Ambiente local configurado com sucesso! ==="
echo ""
echo "Para iniciar o servidor de desenvolvimento:"
echo "  cd $TARGET_DIR && npm run dev"
echo ""
echo "Para gerar o build de produção:"
echo "  cd $TARGET_DIR && npm run build"
