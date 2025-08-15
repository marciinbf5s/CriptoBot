from flask import Blueprint, jsonify
import os
from datetime import datetime

decision_log = Blueprint('decision_log', __name__)

LOG_FILE = os.path.join(os.path.dirname(__file__), '../logs/bot_decision.log')

@decision_log.route('/bot-decision-log', methods=['GET'])
def get_bot_decision_log():
    if not os.path.exists(LOG_FILE):
        return jsonify([])
    logs = []
    with open(LOG_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                parts = line.strip().split('|', 2)
                if len(parts) == 3:
                    dt, level, msg = parts
                    logs.append({
                        'datetime': dt,
                        'level': level,
                        'message': msg
                    })
            except Exception:
                continue
    # Ordena do mais recente para o mais antigo
    logs.sort(key=lambda x: x['datetime'], reverse=True)
    return jsonify(logs)
