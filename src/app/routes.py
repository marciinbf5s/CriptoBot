from flask import Blueprint, render_template, request, jsonify, Response
import json
import logging
from binance.client import Client
import os
from .bot_controller import start_bot, stop_bot
from .auth_controller import auth
from flask import redirect, url_for, session, send_from_directory
import os.path

routes = Blueprint("routes", __name__) 

# Get the absolute path to the config file
CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app', 'config.json')
CONFIG_FILE = CONFIG_PATH  # For backward compatibility


# Página de login
@routes.route("/", methods=["GET"])
def home_redirect():
    if "username" in session:  # exemplo simples, verifica se usuário está logado
        return redirect(url_for("routes.dashboard"))  # redireciona para dashboard ou página principal do app
    else:
        return redirect(url_for("auth.login"))
# Página de dashboard
@routes.route("/dashboard")
def dashboard():
    # Protege o acesso: só entra se estiver logado
    if not session.get('username'):
        return redirect(url_for('auth.login'))

    # Se logado, renderiza o dashboard com o nome do usuário
    return render_template("dashboard.html", username=session['username'])
    if 'username' not in session:
        return redirect(url_for('auth.login'))
    return render_template('dashboard.html', username=session['username'])

# Gráfico
@routes.route('/chart')
def chart():
    return render_template('chart.html')

# Ajuda
@routes.route('/ajuda')
def ajuda():
    return render_template('ajuda.html')

# Atualizar a configuração
@routes.route("/update-config", methods=["POST"])
def update_config():
    try:
        new_config = request.json

        # Carrega config atual
        with open(CONFIG_FILE, "r") as f:
            existing_config = json.load(f)

        # Atualiza só os campos enviados, mantendo o resto
        existing_config.update(new_config)

        # Salva novamente o arquivo com o merge
        with open(CONFIG_FILE, "w") as f:
            json.dump(existing_config, f, indent=4)

        return jsonify({"message": "Configuração atualizada com sucesso!"})

    except Exception as e:
        return jsonify({"error": f"Erro ao atualizar configuração: {str(e)}"}), 500

# Testar a conexão com a API
@routes.route("/test-connection", methods=["POST"])
def test_connection():
    try:
        data = request.get_json()

        # Se não receber chaves no JSON, tenta ler do arquivo config na chave "api"
        if not data or not data.get("apiKey") or not data.get("secretKey"):
            # lê do arquivo config
            if os.path.exists(CONFIG_FILE):
                with open(CONFIG_FILE, "r") as f:
                    config = json.load(f)
                api_key = config.get("api", {}).get("apiKey")
                secret_key = config.get("api", {}).get("secretKey")
            else:
                return jsonify({"success": False, "message": "Chaves API ausentes"}), 400
        else:
            api_key = data.get("apiKey")
            secret_key = data.get("secretKey")

        if not api_key or not secret_key:
            return jsonify({"success": False, "message": "API Key e Secret Key são obrigatórios"}), 400

        # Testa a conexão com a Binance
        client = Client(api_key, secret_key)
        account_info = client.get_account()

        if not account_info:
            raise ValueError("Informações da conta não retornadas")

        return jsonify({"success": True, "message": "Conexão bem-sucedida"}), 200

    except Exception as e:
        error_msg = str(e)
        logging.error(f"Erro ao testar conexão: {error_msg}")

        if "Invalid API-key" in error_msg:
            return jsonify({"success": False, "message": "Chave API inválida ou IP sem permissão"}), 401
        elif "Invalid API-key, IP, or permissions for action" in error_msg:
            return jsonify({"success": False, "message": "IP não autorizado ou permissões insuficientes"}), 403

        return jsonify({"success": False, "message": f"Erro ao testar conexão: {error_msg}"}), 500

# Salvar as chaves
@routes.route("/save-keys", methods=["POST"])
def save_keys():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Chaves API ausentes"}), 400

        api_key = data.get("apiKey")
        secret_key = data.get("secretKey")

        if not api_key or not secret_key:
            return jsonify({"error": "API Key e Secret Key são obrigatórios"}), 400

        # Carregar config.json atual (ou criar estrutura vazia)
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
        else:
            config = {}

        # Garante que a chave 'api' exista e seja um dict
        if "api" not in config or not isinstance(config["api"], dict):
            config["api"] = {}

        # Atualiza apenas as chaves dentro de 'api'
        config["api"]["apiKey"] = api_key
        config["api"]["secretKey"] = secret_key

        # Remove possíveis chaves duplicadas no nível raiz
        config.pop("apiKey", None)
        config.pop("secretKey", None)

        # Salvar de volta no arquivo
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)

        logging.info("Chaves API salvas no config.json com sucesso")
        return jsonify({"message": "Chaves salvas com sucesso!"}), 200

    except Exception as e:
        logging.error(f"Erro ao salvar chaves: {str(e)}")
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500

# Retornar a configuração atual
@routes.route("/get-config", methods=["GET"])
def get_config():
    try:
        with open(CONFIG_FILE, "r") as f:
            config = json.load(f)
        # Remove secretKey para não expor
        config.pop("secretKey", None)
        return jsonify(config), 200
    except FileNotFoundError:
        return jsonify({"error": "Configuração não encontrada"}), 404
    except Exception as e:
        return jsonify({"error": f"Erro ao ler config: {str(e)}"}), 500

# Saldo da conta
@routes.route("/account-balances", methods=["GET"])
def account_balances():
    try:
        with open(CONFIG_FILE, "r") as f:
            config = json.load(f)

        api_key = config.get("api", {}).get("apiKey")
        secret_key = config.get("api", {}).get("secretKey")

        if not api_key or not secret_key:
            return jsonify({"error": "API Key ou Secret Key ausentes"}), 400

        client = Client(api_key, secret_key)
        account_info = client.get_account()

        balances = []
        total_usdt = 0.0

        # Obtem preços de todos os pares com USDT
        prices = {}
        tickers = client.get_ticker()
        for t in tickers:
            symbol = t['symbol']
            if symbol.endswith('USDT'):
                prices[symbol] = float(t['lastPrice'])

        for asset in account_info["balances"]:
            free = float(asset["free"])
            locked = float(asset["locked"])
            total = free + locked
            if total > 0:
                asset_name = asset["asset"]
                valor_em_usdt = 0.0

                if asset_name == "USDT":
                    valor_em_usdt = total
                else:
                    symbol = f"{asset_name}USDT"
                    if symbol in prices:
                        valor_em_usdt = total * prices[symbol]

                total_usdt += valor_em_usdt

                balances.append({
                    "asset": asset_name,
                    "free": free,
                    "locked": locked,
                    "total": total,
                    "valor_em_usdt": valor_em_usdt
                })

        # Adiciona uma linha extra com o total geral
        balances.append({
            "asset": "TOTAL",
            "free": "",
            "locked": "",
            "total": "",
            "valor_em_usdt": round(total_usdt, 2)
        })

        return jsonify({
            "balances": balances,
            "total_usdt": round(total_usdt, 2)   
        }), 200

    except Exception as e:
        logging.error(f"Erro ao obter saldos: {e}")
        return jsonify({"error": f"Erro ao obter saldos: {str(e)}"}), 500

# Iniciar o bot
@routes.route("/start-bot", methods=["POST"])
def start_bot_route():
    try:
        # Ler o JSON completo antes de modificar
        with open(CONFIG_FILE, "r") as f:
            config = json.load(f)

        api_key = config.get("api", {}).get("apiKey")
        secret_key = config.get("api", {}).get("secretKey")

        if not api_key or not secret_key:
            return jsonify({
                "success": False,
                "message": "Você precisa configurar e salvar suas API Keys antes de iniciar o bot.",
                "error_type": "missing_credentials"
            }), 400

        # Tenta iniciar o bot e captura o resultado
        bot_result = start_bot()
        
        # Verifica se o retorno é um dicionário (contendo erro) ou booleano (comportamento antigo)
        if isinstance(bot_result, dict) and bot_result.get("status") == "error":
            error_message = bot_result.get("message", "Erro desconhecido ao iniciar o bot.")
            error_type = "api_error"
            
            # Mapeia mensagens de erro para tipos específicos
            if "chave de API inválida" in error_message.lower():
                error_type = "invalid_api_key"
            elif "ip não autorizado" in error_message.lower() or "permissão" in error_message.lower():
                error_type = "unauthorized_ip"
                
            return jsonify({
                "success": False,
                "message": error_message,
                "error_type": error_type
            }), 401
        elif bot_result:  # Se for True (comportamento antigo de sucesso)
            # Atualiza só o campo running
            config["running"] = True
            with open(CONFIG_FILE, "w") as f:
                json.dump(config, f, indent=4)  # mantém todo o restante intacto
            
            return jsonify({
                "success": True,
                "message": "Bot iniciado com sucesso!"
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "O bot já está em execução.",
                "error_type": "already_running"
            }), 400

    except Exception as e:
        error_message = str(e)
        error_type = "unknown_error"
        
        # Tratamento específico para erros comuns da Binance
        if "API-key format invalid" in error_message or "Signature" in error_message:
            error_message = "Chave de API inválida ou expirada. Verifique suas credenciais."
            error_type = "invalid_api_key"
        elif "Invalid API-key, IP, or permissions" in error_message:
            error_message = "Chave de API inválida ou IP não autorizado. Verifique suas permissões na Binance."
            error_type = "unauthorized_ip"
            
        logging.error(f"Erro ao iniciar o bot: {error_message}")
        return jsonify({
            "success": False,
            "message": f"Erro ao iniciar o bot: {error_message}",
            "error_type": error_type
        }), 500

# Parar o bot
@routes.route("/stop-bot", methods=["POST"])
def stop_bot_route():
    try:
        stopped = stop_bot()
        if stopped:
            # Atualiza só o campo running no JSON
            with open(CONFIG_FILE, "r") as f:
                config = json.load(f)
            config["running"] = False
            with open(CONFIG_FILE, "w") as f:
                json.dump(config, f, indent=4)  # indent para legibilidade

            return jsonify({"success": True, "message": "Bot parado com sucesso."}), 200
        else:
            return jsonify({"success": False, "message": "Bot já está parado."}), 400
    except Exception as e:
        logging.error(f"Erro ao parar o bot: {str(e)}")
        return jsonify({"success": False, "message": f"Erro ao parar bot: {str(e)}"}), 500

#Status do bot
@routes.route("/bot-status", methods=["GET"])
def bot_status():
    try:
        with open(CONFIG_FILE, "r") as f:
            config = json.load(f)
        running = config.get("running", False)
        status = "executando" if running else "parado"
        return jsonify({"running": running, "status": status}), 200
    except Exception as e:
        logging.error(f"Erro ao obter status do bot: {str(e)}")
        return jsonify({"error": "Não foi possível obter o status do bot"}), 500

# Rota de ping para manter a aplicação ativa no Render
@routes.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "alive", "message": "Pong!"}), 200
