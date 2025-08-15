#!/bin/bash
set -o errexit

# Cria o diretório de destino se não existir
mkdir -p src/app

# Verifica se o arquivo config.json existe antes de copiar
if [ -f "src/app/config.json" ]; then
    echo "Arquivo config.json já existe em src/app/"
elif [ -f "config.json" ]; then
    echo "Copiando config.json para src/app/"
    cp config.json src/app/config.json
else
    echo "AVISO: Nenhum arquivo config.json encontrado. Certifique-se de criar um em src/app/"
fi

# Instala as dependências
pip install -r requirements.txt