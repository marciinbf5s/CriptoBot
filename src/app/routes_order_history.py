from flask import Blueprint, request, jsonify
import os
import re
from datetime import datetime

order_history = Blueprint('order_history', __name__)

LOG_FILE = os.path.join(os.path.dirname(__file__), '../logs/trading_bot.log')

# Expressão regular para identificar blocos de ordem no log
ORDER_BLOCK_REGEX = re.compile(r'(?<=--------------------\n)ORDEM ENVIADA:.*?Data/Hora: (.*?)\n.*?Status: (.*?)\nSide: (.*?)\nAtivo: (.*?)\nQuantidade: (.*?)\nPreço enviado: (.*?)\nValor na (compra|venda): (.*?)\nMoeda: (.*?)\nValor em .*?: (.*?)\nType: (.*?)\n', re.DOTALL)

# Rota para buscar histórico de ordens com filtro de data
@order_history.route('/order-history', methods=['GET'])
def get_order_history():
    start_date = request.args.get('start_date')  # formato yyyy-mm-dd
    end_date = request.args.get('end_date')      # formato yyyy-mm-dd

    if not os.path.exists(LOG_FILE):
        return jsonify([])

    # Try different encodings to handle various character encodings
    encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
    log_content = None
    
    for encoding in encodings:
        try:
            with open(LOG_FILE, 'r', encoding=encoding) as f:
                log_content = f.read()
            break  # If successful, exit the loop
        except UnicodeDecodeError:
            continue  # Try next encoding
    
    if log_content is None:
        return jsonify({'error': 'Could not read log file with any supported encoding'}), 500

    orders = []
    for match in ORDER_BLOCK_REGEX.finditer(log_content):
        # Extrai campos do regex
        datahora, status, side, ativo, quantidade, preco, tipo_op, preco_unit, moeda, valor, tipo = match.groups()
        # Extrai só a data para filtro
        try:
            dt = datetime.strptime(datahora.strip()[1:20], '%H:%M:%S) %Y-%m-%d')
        except Exception:
            continue
        order = {
            'datahora': datahora.strip(),
            'status': status.strip(),
            'side': side.strip(),
            'ativo': ativo.strip(),
            'quantidade': quantidade.strip(),
            'preco': preco.strip(),
            'tipo_operacao': tipo_op.strip(),
            'preco_unit': preco_unit.strip(),
            'moeda': moeda.strip(),
            'valor': valor.strip(),
            'tipo': tipo.strip(),
            'datetime_obj': dt
        }
        orders.append(order)

    # Filtragem por data se fornecido
    if start_date:
        start = datetime.strptime(start_date, '%Y-%m-%d')
        orders = [o for o in orders if o['datetime_obj'].date() >= start.date()]
    if end_date:
        end = datetime.strptime(end_date, '%Y-%m-%d')
        orders = [o for o in orders if o['datetime_obj'].date() <= end.date()]

    # Ordenar por data/hora decrescente
    orders.sort(key=lambda o: o['datetime_obj'], reverse=True)
    # Remove objeto datetime antes de retornar
    for o in orders:
        del o['datetime_obj']

    return jsonify(orders)
