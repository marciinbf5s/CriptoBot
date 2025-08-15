import os
import sys
import threading
import time
import json
import logging
from binance.client import Client

# Adiciona src ao sys.path para importar Models, modules, strategies
SRC_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if SRC_PATH not in sys.path:
    sys.path.append(SRC_PATH)

from ..Models.StockStartModel import StockStartModel
from ..modules.BinanceTraderBot import BinanceTraderBot
from ..strategies.moving_average import getMovingAverageTradeStrategy
from ..strategies.vortex_strategy import getVortexTradeStrategy
from ..strategies.ema_microtrade import getShortTermEMAStrategy



# Configurações, logging e setup conforme seu código

logging.basicConfig(
    filename="logs/trading_bot.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

# Get the absolute path to the config file

# Caminho absoluto do arquivo config.json
config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app', 'config.json')

try:
    with open(config_path, "r", encoding="utf-8") as f:
        config_data = f.read()
        print("Conteúdo do JSON:", config_data)  # Debug para ver o que tem no arquivo
        config = json.loads(config_data)
except json.JSONDecodeError as e:
    print(f"Erro ao decodificar JSON no arquivo {config_path}: {e}")
    config = None  # Ou defina algum valor padrão/ação para erro
except Exception as e:
    print(f"Erro ao abrir arquivo de configuração {config_path}: {e}")
    config = None

strategies = {
    "getMovingAverageAntecipationTradeStrategy": getMovingAverageAntecipationTradeStrategy,
    "getMovingAverageTradeStrategy": getMovingAverageTradeStrategy,
    "getVortexTradeStrategy": getVortexTradeStrategy,
    "getShortTermEMAStrategy": getShortTermEMAStrategy,
    "utBotAlerts":utBotAlerts,
    "getScalpingEMA_strategy": getScalpingEMA_strategy,
    "getRsiTradeStrategy": getRsiTradeStrategy,
    "getMovingAverageRSIVolumeStrategy": getMovingAverageRSIVolumeStrategy,
    "getAdvancedTradeStrategy_v3": getAdvancedTradeStrategy_v3,
}

mainStrategy = strategies[config["mainStrategy"]]
fallbackStrategy = strategies[config["fallbackStrategy"]]

stocks_traded_list = [
    StockStartModel(
        stockCode=stock["stockCode"],
        operationCode=stock["operationCode"],
        tradedQuantity=stock["tradedQuantity"],
        mainStrategy=mainStrategy,
        mainStrategyArgs=config["mainStrategyArgs"],
        fallbackStrategy=fallbackStrategy,
        fallbackStrategyArgs=config["fallbackStrategyArgs"],
        candlePeriod=Client.KLINE_INTERVAL_15MINUTE,
        stopLossPercentage=config["stopLossPercentage"],
        timeToTrade=config["timeToTrade"],
        delayAfterOrder=config["delayAfterOrder"],
        acceptableLossPercentage=config["acceptableLossPercentage"],
        fallbackActivated=config["fallbackActivated"],
        #takeProfitAtPercentage=config["TP_AT_PERCENTAGE"],
        #takeProfitAmountPercentage=config["TP_AMOUNT_PERCENTAGE"],
    )
    for stock in config["stocks_traded_list"]
]

THREAD_LOCK = config["THREAD_LOCK"]
thread_lock = threading.Lock()
threads = []
running = False  # Flag global para controlar execução


def trader_loop(stockStart: StockStartModel):
    try:
        MaTrader = BinanceTraderBot(
            stock_code=stockStart.stockCode,
            operation_code=stockStart.operationCode,
            traded_quantity=stockStart.tradedQuantity,
            candlePeriod=stockStart.candlePeriod,
            timeToTrade=stockStart.timeToTrade,
            delayAfterOrder=stockStart.delayAfterOrder,
            acceptableLossPercentage=stockStart.acceptableLossPercentage,
            stopLossPercentage=stockStart.stopLossPercentage,
            fallbackActivated=stockStart.fallbackActivated,
            mainStrategy=stockStart.mainStrategy,
            mainStrategyArgs=stockStart.mainStrategyArgs,
            fallbackStrategy=stockStart.fallbackStrategy,
            fallbackStrategyArgs=stockStart.fallbackStrategyArgs,
        )
    except Exception as e:
        error_message = str(e)
        if "API-key format invalid" in error_message or "Signature" in error_message:
            error_msg = "Erro de autenticação: Chave de API inválida ou expirada. Verifique suas credenciais."
        elif "Invalid API-key, IP, or permissions" in error_message:
            error_msg = "Erro de permissão: Chave de API inválida ou IP não autorizado. Verifique suas permissões na Binance."
        else:
            error_msg = f"Erro ao inicializar o robô: {error_message}"
        
        # Log do erro
        logging.error(error_msg)
        print(f"\n❌ {error_msg}")
        
        # Retorna o status de erro para ser capturado pelas rotas
        return {"status": "error", "message": error_msg}
        
        # Encerra a thread em caso de erro de autenticação
        if "chave de API" in error_msg.lower() or "permissão" in error_msg.lower():
            return

    while running:
        if THREAD_LOCK:
            with thread_lock:
                MaTrader.execute()
        else:
            MaTrader.execute()
    
    # Garantir que time_to_sleep seja um número antes de passar para time.sleep()
        time_to_sleep = float(MaTrader.time_to_sleep)  # ou int(MaTrader.time_to_sleep), dependendo do valor esperado
        time.sleep(time_to_sleep)




def start_bot():
    global running, threads
    if running:
        return False  # Já está rodando
    running = True
    threads = []
    for asset in stocks_traded_list:
        thread = threading.Thread(target=trader_loop, args=(asset,))
        thread.daemon = True
        thread.start()
        threads.append(thread)
    return True

def stop_bot():
    global running
    if not running:
        return False
    running = False
    return True

