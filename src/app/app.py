import sys
import os
import json
import time
import traceback
from datetime import timedelta
from flask import Flask, session
from flask_cors import CORS

from src.app.auth_controller import auth

from src.app.routes_bot_decision_log import decision_log

# Adiciona o diretório raiz ao PATH
SRC_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(SRC_PATH)


try:
    from src.app.routes import routes
except Exception as e:
    print("Erro ao importar routes:")
    traceback.print_exc()  # Isso mostra a stacktrace completa
    sys.exit(1)

app = Flask(__name__)

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_SAMESITE='Lax'
)

app.secret_key = '12345678'
app.permanent_session_lifetime = timedelta(days=30)

app.register_blueprint(routes)
app.register_blueprint(auth)
app.register_blueprint(decision_log)

import atexit

def set_running_false():
    try:
        from src.app.bot_controller import stop_bot
        stop_bot()
    except Exception as e:
        print(f"Erro ao chamar stop_bot() no shutdown: {e}")
    config_path = os.path.join(os.path.dirname(__file__), "config.json")
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
            config['running'] = False
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=4)
        except Exception as e:
            print(f"Erro ao setar running=false no shutdown: {e}")

atexit.register(set_running_false)

if __name__ == "__main__":
    print("Iniciando servidor Flask...")
    app.run(debug=True, port=5000)

