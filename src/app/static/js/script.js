// ==============================================
// DECLARAÇÕES DE VARIÁVEIS E CONSTANTES
// ==============================================

// Variável global para armazenar os presets
window.presets = window.presets || [];

// Elementos DOM
const elements = {
    // Formulários e inputs
    apiKeysForm: document.getElementById("api-keys-form"),
    presetForm: document.getElementById("presetForm"),
    stocksContainer: document.getElementById("stocksContainer"),
    
    // Inputs
    apiKeyInput: document.querySelector('input[name="apiKey"]'),
    secretKeyInput: document.querySelector('input[name="secretKey"]'),
    inputSimbolo: document.getElementById("input-simbolo"),
    
    // Botões
    btnSalvarChaves: document.getElementById("btn-salvar-chaves"),
    btnTestarConexao: document.getElementById("btn-testar-conexao"),
    btnSalvarPreset: document.getElementById("btnSalvarPreset"),
    confirmBtn: document.getElementById("confirmBtn"),
    cancelBtn: document.getElementById("cancelBtn"),
    
    // Modais
    confirmationModal: document.getElementById("confirmationModal"),
    presetModal: document.getElementById("presetModal"),
    
    // Containers de exibição
    resultadoPreco: document.getElementById("resultado-preco"),
    saldoTabela: document.getElementById("saldoTabela"),
    saldoConta: document.getElementById("saldo-conta"),
    notification: document.getElementById("notification"),
    quickSettings: document.getElementById("quick-settings"),
    fallbackStrategyContainer: document.getElementById("fallbackStrategyContainer"),
    
    // Seletores
    fallbackSelect: document.getElementById('fallbackActivated')
};

// Variáveis globais
let intervaloAtualizacao = null;
let editPresetId = null;

// Constantes de configuração
const DEFAULT_CONFIG = {
    timeToTrade: 60,
    delayAfterOrder: 3,
    fallbackActivated: false,
    fallbackStrategy: "getVortexTradeStrategy",
    acceptaLossPercentage: 1,
    stopLosPercentage: 2,
    candlePeriod: "Client.KLINE_INTERVAL_15MINUTE",
    stocks_traded_list: [ 
        {
            stockCode: "BTC",
            operationCode: "BTCUSDT",
            tradedQuantity: 10
        }
    ],
    api: {
        apiKey: "",
        secretKey: ""
    }
};

// Presets armazenados (pode ser puxado do backend)
let presets = [
    {
        id: 1,
        name: "padrao",
        tradedQuantity: 10,
        mainStrategy: "getShortTermEMAStrategy",
        fallbackActivated: false,
        fallbackStrategy: "getVortexTradeStrategy",
        acceptaLossPercentage: 1,
        stopLossPercentage: 2,
        candlePeriod: "Client.KLINE_INTERVAL_15MINUTE",
        timeToTrade: 60,
        delayAfterOrder: 3,
        stocks_traded_list:  [
            {
                stockCode: "BTC",
                operationCode: "BTCUSDT",
                tradedQuantity: 10
            }
        ]
    },
];

// ==============================================
// FUNÇÕES PRINCIPAIS
// ==============================================

// Atualiza a configuração    
async function atualizarConfig() {
    // Coletar dados do formulário
    const candlePeriodEl = document.getElementById("candlePeriod");
    const acceptableLossEl = document.getElementById("acceptableLossPercentage");
    const stopLossEl = document.getElementById("stopLossPercentage");
    const timeToTradeEl = document.getElementById("timeToTrade");
    const delayAfterOrderEl = document.getElementById("delayAfterOrder");

    const jsonData = {
        stocks_traded_list: [],
        candlePeriod: candlePeriodEl ? candlePeriodEl.value : null,
        acceptableLossPercentage: acceptableLossEl ? acceptableLossEl.value : null,
        stopLossPercentage: stopLossEl ? stopLossEl.value : null,
        timeToTrade: timeToTradeEl ? timeToTradeEl.value : null,
        delayAfterOrder: delayAfterOrderEl ? delayAfterOrderEl.value : null,
    };


    // Adicionar stocks do formulário
    if (elements.stocksContainer) {
        elements.stocksContainer.querySelectorAll(".stock-item").forEach(row => {
            const stockCode = row.querySelector('[name="stockCode"]')?.value;
            const operationCode = row.querySelector('[name="operationCode"]')?.value;
            const tradedQuantity = parseFloat(row.querySelector('[name="tradedQuantity"]')?.value);

            if (stockCode && operationCode && tradedQuantity) {
                jsonData.stocks_traded_list.push({
                    stockCode: stockCode,
                    operationCode: operationCode,
                    tradedQuantity: tradedQuantity
                });
            }
        });
    }

}

// Seleciona a seção e destaca o botão correspondente
function selecionarSecao(id) {
    // Esconde todas as seções
    const secoes = document.querySelectorAll('section');
    secoes.forEach(secao => {
        secao.classList.remove('ativo');
        secao.style.display = 'none';
    });
    
    // Mostra a seção selecionada
    const secaoSelecionada = document.getElementById(id);
    if (secaoSelecionada) {
        secaoSelecionada.classList.add('ativo');
        secaoSelecionada.style.display = 'block';
        
        // Se for a seção de configurações rápidas, garante que o container está visível
        if (id === 'config-rapida') {
            const quickSettings = document.getElementById('quick-settings');
            if (quickSettings) {
                quickSettings.style.display = 'flex';
                // Recarrega os presets quando a seção é aberta
                renderPresets();
            }
        }
    }

    // Remove a classe 'active' de todos os botões
    const botoes = document.querySelectorAll('#sidebar .btn');
    botoes.forEach(botao => {
        botao.classList.remove('active');
    });
    
    // Adiciona a classe 'active' ao botão correspondente
    const botaoAtivo = document.querySelector(`[data-section="${id}"]`);
    if (botaoAtivo) {
        botaoAtivo.classList.add('active');
    }
    
    // Atualiza a URL sem recarregar a página
    window.history.pushState({}, '', `#${id}`);
}

// Carregar Configuração
async function carregarConfiguracao() {
    try {
        const response = await fetch("/get-config");
        const data = await response.json();
        
        if (!response.ok) {
            showNotification(data.error || "Erro ao carregar configuração", "error");
            return;
        }
        
        // Preencher os campos do formulário de API Keys
        if (data.api) {
            if (elements.apiKeyInput) elements.apiKeyInput.value = data.api.apiKey || '';
            if (elements.secretKeyInput) elements.secretKeyInput.value = data.api.secretKey || '';
        }
        
        // Carregar presets se existirem
        if (data.presets && Array.isArray(data.presets) && data.presets.length > 0) {
            window.presets = data.presets;
            // Renderiza os presets se estivermos na seção de configurações rápidas
            if (document.getElementById('config-rapida')?.classList.contains('ativo')) {
                renderPresets();
            }
        } else {
            // Inicializa com array vazio se não houver presets
            window.presets = [];
        }
        
        // Preencher lista de ações (stocks)
        if (Array.isArray(data.stocks_traded_list) && data.stocks_traded_list.length > 0) {
            if (elements.stocksContainer) {
                elements.stocksContainer.innerHTML = ""; // limpa o container atual
                
                data.stocks_traded_list.forEach(stock => {
                    const div = document.createElement("div");
                    div.classList.add("stock-item");
                    div.innerHTML = `
                        <div class="stock-fields">
                            <input type="text" name="stockCode" value="${stock.stockCode}" placeholder="Código da ação" />
                            <input type="text" name="operationCode" value="${stock.operationCode}" placeholder="Operação" />
                            <input type="number" name="tradedQuantity" value="${stock.tradedQuantity}" placeholder="Quantidade" />
                        </div>
                    `;
                    elements.stocksContainer.appendChild(div);
                });
            } else {
                console.error("Elemento stocksContainer não encontrado no DOM");
            }
        }
    } catch (error) {
        console.error("Erro inesperado ao carregar configuração:", error);
        showNotification("Erro inesperado ao carregar configuração", "error");
    }
}

// Função de notificação
function showNotification(message, type = "success") {
    elements.notification.textContent = message;
    elements.notification.className = type === "error" ? "error" : "success";
    elements.notification.style.display = "block";
    elements.notification.style.opacity = "1";
    elements.notification.style.transform = "translateY(0)";

    setTimeout(() => {
        elements.notification.style.opacity = "0";
        elements.notification.style.transform = "translateY(-20px)";
        setTimeout(() => {
            elements.notification.style.display = "none";
        }, 300);
    }, 3000);
}

// Carregar Saldo
async function carregarSaldos() {
try {
    const response = await fetch("/account-balances");
    const data = await response.json();

    if (!response.ok) {
        showNotification(data.error || "Erro ao carregar saldos", "error");
        return;
    }

    elements.saldoTabela.innerHTML = "";
    let totalAtivos = 0;
    let totalUSDT = 0;

    data.balances.forEach(item => {
        // Ignora qualquer linha com asset === "TOTAL"
        if (item.asset === "TOTAL") return;

        const row = document.createElement("tr");

        row.innerHTML = `
            <td><strong>${item.asset}</strong></td>
            <td>${item.free !== "" ? parseFloat(item.free).toFixed(8) : "*"}</td>
            <td>${item.locked !== "" ? parseFloat(item.locked).toFixed(8) : "*"}</td>
            <td>${item.total !== "" ? parseFloat(item.total).toFixed(8) : "*"}</td>
            <td><strong>${item.valor_em_usdt !== undefined && item.valor_em_usdt !== "" ? parseFloat(item.valor_em_usdt).toFixed(2) : "*"} USDT</strong></td>
        `;

        elements.saldoTabela.appendChild(row);

        if (item.total !== "") totalAtivos += parseFloat(item.total);
        if (item.valor_em_usdt !== undefined && item.valor_em_usdt !== "") {
            totalUSDT += parseFloat(item.valor_em_usdt);
        }
    });

    // Adiciona linha do TOTAL ao final da tabela
    const totalRow = document.createElement("tr");
    totalRow.innerHTML = `
        <td><strong>TOTAL</strong></td>
        <td>*</td>
        <td>*</td>
        <td>*</td>
        <td><strong>${totalUSDT.toFixed(2)} USDT</strong></td>
    `;
    elements.saldoTabela.appendChild(totalRow);

    // Atualiza o texto fora da tabela também (opcional)
    elements.saldoConta.textContent = `Total em USDT: ${totalUSDT.toFixed(2)}`;

} catch (error) {
    showNotification("Erro ao carregar saldos", "error");
    console.error(error);
}
}



// Controle do Bot
const btnStart = document.getElementById("btn-start-bot");
const btnStop = document.getElementById("btn-stop-bot");
const stopBotConfirmationModal = document.getElementById("stopBotConfirmationModal");
const confirmStopBtn = document.getElementById("confirmStopBtn");
const cancelStopBtn = document.getElementById("cancelStopBtn");

// Função para atualizar estado dos botões conforme status do bot
async function atualizarStatusBot() {
try {
const response = await fetch("/bot-status");
const data = await response.json();

console.log("Status do bot:", data.running); // <- ADICIONE ISTO

if (!response.ok) {
  console.error("Erro ao obter status do bot:", data.error || data.message);
  return;
}

if (data.running) {
  btnStart.disabled = true;
  btnStop.disabled = false;
} else {
  btnStart.disabled = false;
  btnStop.disabled = true;
}
} catch (error) {
console.error("Erro ao buscar status do bot:", error);
}
}

// Funções startBot e stopBot continuam, só que agora chamam atualizarStatusBot no finally para manter estado atualizado
async function startBot() {
btnStart.disabled = true;
btnStop.disabled = true;

try {
const response = await fetch('/start-bot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});
const data = await response.json();

if (data.success) {
  showNotification(data.message || "Bot iniciado com sucesso!", "success");

  // Atualiza estado do botão imediatamente sem esperar o fetch da rota status
  btnStart.disabled = true;
  btnStop.disabled = false;

} else {
  showNotification(data.message || "Erro ao iniciar o bot.", "error");
}
} catch (err) {
showNotification("Erro ao iniciar o bot: " + err.message, "error");
} finally {
setTimeout(atualizarStatusBot, 1000); // adiciona delay leve para garantir que JSON foi salvo
}
}

async function stopBot() {
btnStart.disabled = true;
btnStop.disabled = true;

try {
const response = await fetch('/stop-bot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});
const data = await response.json();

if (data.success) {
  showNotification(data.message || "Bot parado com sucesso!", "error");

  // Atualiza estado do botão imediatamente
  btnStart.disabled = false;
  btnStop.disabled = true;

} else {
  showNotification(data.message || "Erro ao parar o bot.", "error");
}
} catch (err) {
showNotification("Erro ao parar o bot: " + err.message, "error");
} finally {
setTimeout(atualizarStatusBot, 1000); // delay leve para garantir que JSON foi escrito
}
}

// Função para mostrar o modal de confirmação para parar o bot
function showStopBotConfirmation() {
  if (stopBotConfirmationModal) {
    stopBotConfirmationModal.style.display = "block";
  }
}

// Função para esconder o modal de confirmação para parar o bot
function hideStopBotConfirmation() {
  if (stopBotConfirmationModal) {
    stopBotConfirmationModal.style.display = "none";
  }
}

// Associar eventos aos botões
if (btnStart) btnStart.onclick = startBot;
if (btnStop) btnStop.onclick = showStopBotConfirmation;

// Atualiza status dos botões ao carregar a página
window.addEventListener("load", atualizarStatusBot);

// Opcional: atualiza status periodicamente
setInterval(atualizarStatusBot, 30000);


// Gestão de Presets
function renderPresets() {
    elements.quickSettings.innerHTML = '';

      // Cards existentes
    presets.forEach(preset => {
        const card = document.createElement('div');
        card.className = 'preset-card';
        card.dataset.presetId = preset.id;
        card.innerHTML = `
            <div class="preset-title" id="preset-title">${preset.name}</div>
            <div id="preset-quantity"><strong>Quantidade:</strong> ${preset.tradedQuantity}</div>
            <div id="preset_strategy"><strong>Estratégia:</strong> ${preset.mainStrategy.replace('get', '').replace('TradeStrategy', '').trim()}</div>
            <div class="icon-container">
                <button class="edit-icon" aria-label="Editar ${preset.name}" onclick="abrirModal(${preset.id}); event.stopPropagation();">✏️</button>
                <button class="delete-icon" aria-label="Deletar ${preset.name}" onclick="deletarPreset(${preset.id}); event.stopPropagation();">🗑️</button>
            </div>
        `;

        card.addEventListener("click", () => {
            elements.confirmationModal.dataset.selectedPresetId = preset.id; // define primeiro
            elements.confirmationModal.style.display = "flex";               // abre depois
        });
        // Fecha modal ao clicar fora
        window.addEventListener("click", (e) => {
            if (e.target === elements.confirmationModal) {
                elements.confirmationModal.style.display = "none";
            }
        });
        window.addEventListener("click", (e) => {
            if (e.target === elements.presetModal) {
                elements.presetModal.style.display = "none";
            }
        });

        elements.quickSettings.appendChild(card);
    });

    // Card para adicionar novo preset
    const addCard = document.createElement('div');
    addCard.className = 'preset-card';
    addCard.style.justifyContent = 'center';
    addCard.style.alignItems = 'center';
    addCard.style.fontWeight = 'bold';
    addCard.style.fontSize = '1.2rem';
    addCard.style.color = '#00e0ff';
    addCard.style.cursor = 'pointer';
    addCard.innerText = '+ Adicionar Predefinição';
    addCard.onclick = () => abrirModal();
    elements.quickSettings.appendChild(addCard);
}

function deletarPreset(id) {
    const preset = presets.find(p => p.id === id);
    if (!preset) return;

    const confirmar = confirm(`Tem certeza que deseja deletar a predefinição "${preset.name}"?`);
    if (!confirmar) return;

    presets = presets.filter(p => p.id !== id);
    renderPresets();
}

function abrirModal(id = null) {
    editPresetId = id;
    const form = elements.presetForm;
    const title = document.getElementById('modalTitle');

    if (id) {
        // Editar preset existente
        const preset = presets.find(p => p.id === id);
        title.innerText = 'Editar Predefinição';
        form.presetName.value = preset.name;
        form.mainStrategy.value = preset.mainStrategy;
        form.stockCode.value = preset.stockCode;
        form.operationCode.value = preset.operationCode;
        form.tradedQuantity.value = preset.tradedQuantity;
        form.fallbackActivated.value = preset.fallbackActivated;
        form.fallbackStrategy.value = preset.fallbackStrategy;
        form.acceptableLossPercentage.value = preset.acceptableLossPercentage;
        form.stopLossPercentage.value = preset.stopLossPercentage;
        form.timeToTrade.value = preset.timeToTrade;
        form.delayAfterOrder.value = preset.delayAfterOrder;
        form.candlePeriod.value = preset.candlePeriod;
    } else {
        // Novo preset
        title.innerText = 'Nova Predefinição';
        form.reset();
    }
    elements.presetModal.style.display = 'flex';
}

function fecharModal() {
    elements.presetModal.style.display = 'none';
}

function salvarPreset() {
    const form = elements.presetForm;
    const preset = {
        id: editPresetId ?? (presets.length ? Math.max(...presets.map(p => p.id)) + 1 : 1),
        name: form.presetName.value,
        mainStrategy: form.mainStrategy.value,
        stockCode: form.stockCode.value,
        operationCode: form.operationCode.value,
        tradedQuantity: parseFloat(form.tradedQuantity.value),
        fallbackActivated: elements.fallbackSelect.value === 'true',
        fallbackStrategy: form.fallbackStrategy.value,
        acceptableLossPercentage: parseFloat(form.acceptableLossPercentage.value),
        stopLossPercentage: parseFloat(form.stopLossPercentage.value),
        timeToTrade: parseInt(form.timeToTrade.value),
        delayAfterOrder: parseInt(form.delayAfterOrder.value),
        candlePeriod: form.candlePeriod.value,
    };

    if (editPresetId) {
        // Edita preset existente
        const index = presets.findIndex(p => p.id === editPresetId);
        if (index !== -1) presets[index] = preset;
    } else {
        // Novo preset
        presets.push(preset);
    }

    renderPresets();
    fecharModal();
}

function toggleFallbackStrategy() {
    elements.fallbackStrategyContainer.style.display = 
        elements.fallbackSelect.value === 'true' ? 'block' : 'none';
}

// ==============================================
// EVENT LISTENERS
// ==============================================

// Botões
elements.btnSalvarChaves.onclick = async function () {
    this.disabled = true;
    let formData = new FormData(elements.apiKeysForm);
    let jsonData = Object.fromEntries(formData.entries());

    try {
        let response = await fetch("/save-keys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(jsonData),
        });

        let data = await response.json();

        if (response.ok) {
            showNotification(data.message || "Chaves salvas!", "success");
        } else {
            showNotification("Erro ao salvar chaves: " + (data.error || data.message), "error");
        }
    } catch (error) {
        showNotification("Erro inesperado ao salvar chaves.", "error");
        console.error(error);
    }
    this.disabled = false;
};

elements.btnTestarConexao.onclick = async function () {
    this.disabled = true;
    let formData = new FormData(elements.apiKeysForm);
    let jsonData = Object.fromEntries(formData.entries());

    try {
        let responseTest = await fetch("/test-connection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(jsonData),
        });

        let dataTest = await responseTest.json();

        if (responseTest.ok && dataTest.success) {
            showNotification("Conexão testada com sucesso!", "success");
            
            try {
                let responseConfig = await fetch("/get-config");
                let dataConfig = await responseConfig.json();

                console.log("GET /get-config returned:", responseConfig.status, dataConfig);

                if (responseConfig.ok && dataConfig.api) {
                    if (elements.apiKeyInput) elements.apiKeyInput.value = dataConfig.api.apiKey || '';
                    if (elements.secretKeyInput) elements.secretKeyInput.value = dataConfig.api.secretKey || '';
                } else {
                    showNotification(dataConfig.error || "Erro ao carregar configuração", "error");
                }
            } catch (error) {
                console.error("Erro inesperado ao carregar configuração:", error);
                showNotification("Erro inesperado ao carregar configuração", "error");
            }

            carregarSaldos();
        } else {
            showNotification("Erro ao testar conexão: " + (dataTest.message || "Falha desconhecida"), "error");
        }
    } catch (error) {
        showNotification("Erro inesperado ao testar conexão.", "error");
        console.error(error);
    }

    this.disabled = false;
};

elements.btnSalvarPreset.addEventListener("click", function(event) {
    event.preventDefault();
    salvarPreset();
});

// Modal de confirmação
elements.confirmBtn.addEventListener("click", async () => {
    const selectedPresetId = elements.confirmationModal.dataset.selectedPresetId;

    if (!selectedPresetId) {
        showNotification("Preset não selecionado.", "error");
        return;
    }

    const preset = presets.find(p => p.id === parseInt(selectedPresetId));
    if (!preset) {
        showNotification("Preset não encontrado.", "error");
        return;
    }

    const configData = {
mainStrategy: preset.mainStrategy,                     // ex: "getMovingAverageTradeStrategy"
mainStrategyArgs: {},                                  // se você tiver argumentos, passe aqui, senão vazio
fallbackStrategy: preset.fallbackStrategy,
fallbackStrategyArgs: {},
fallbackActivated: preset.fallbackActivated,
acceptableLossPercentage: preset.acceptableLossPercentage, // tipo coerente (string ou number)
stopLossPercentage: preset.stopLossPercentage,
candlePeriod: preset.candlePeriod,
timeToTrade: preset.timeToTrade,
delayAfterOrder: preset.delayAfterOrder,
stocks_traded_list: [
    {
        stockCode: preset.stockCode,
        operationCode: preset.operationCode,
        tradedQuantity: preset.tradedQuantity
    }
],    
};



    try {
        const response = await fetch("/update-config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(configData),
        });

        const result = await response.json();

        if (response.ok) {
            showNotification("Configuração atualizada com sucesso!", "success");
            carregarConfiguracao?.();
        } else {
            showNotification(result.error || "Erro ao atualizar configuração", "error");
        }
    } catch (error) {
        console.error(error);
        showNotification("Erro inesperado ao salvar configuração", "error");
    }

    elements.confirmationModal.style.display = "none";
});

elements.cancelBtn.addEventListener("click", () => {
    elements.confirmationModal.style.display = "none";
});

// Obtém os elementos necessários
const fallbackActivatedSelect = document.getElementById('fallbackActivated');
const fallbackStrategyContainer = document.getElementById('fallbackStrategyContainer');

// Função para alternar a visibilidade do seletor de estratégia de fallback
function toggleFallbackStrategy() {
    // Verifica se o valor selecionado de 'FALLBACK_ACTIVATED' é 'true'
if (fallbackActivatedSelect.value === 'true') {
 // Exibe o campo de estratégia de fallback
fallbackStrategyContainer.style.display = 'block';
} else {
// Oculta o campo de estratégia de fallback
fallbackStrategyContainer.style.display = 'none';
}
}

// Adiciona o evento de mudança no seletor 'FALLBACK_ACTIVATED'
fallbackActivatedSelect.addEventListener('change', toggleFallbackStrategy);

// Chama a função ao carregar a página para garantir que o estado inicial esteja correto
toggleFallbackStrategy();


// Fecha modal ao clicar fora
window.addEventListener("click", (e) => {
    if (e.target === elements.confirmationModal) {
        elements.confirmationModal.style.display = "none";
    }
});

// Clica automaticamente no botão 'Início' ao carregar a página
const botaoHome = document.querySelector('[data-section="home"]');
if (botaoHome) {
    botaoHome.click();
}


// Formulário de preset
elements.presetForm.addEventListener('submit', function (event) {
    event.preventDefault();
    salvarPreset();
});

// ==============================================
// INICIALIZAÇÃO
// ==============================================

// Função para inicializar a aplicação
function inicializarAplicacao() {
    // Inicializa componentes
    toggleFallbackStrategy();
    renderPresets();
    carregarConfiguracao();
    atualizarConfig();
    
    // Inicializa tooltips do Bootstrap
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
        new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Inicializa popovers do Bootstrap
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.forEach(function (popoverTriggerEl) {
        new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Adiciona os listeners dos botões da sidebar
    document.querySelectorAll('#sidebar .btn').forEach(botao => {
        botao.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            if (sectionId) {
                selecionarSecao(sectionId);
            }
        });
    });
    
    // Clica automaticamente no botão 'Início' ao carregar a página
    const botaoHome = document.querySelector('[data-section="home"]');
    if (botaoHome) {
        botaoHome.click();
    }
}

// Inicializa a aplicação quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarAplicacao);
} else {
    // DOM já está carregado
    setTimeout(inicializarAplicacao, 0);
}

// Trata a navegação pelo histórico do navegador
window.addEventListener('popstate', function() {
    const hash = window.location.hash.substring(1);
    const botao = document.querySelector(`[data-section="${hash || 'home'}"]`);
    if (botao) {
        botao.click();
    }
});
document.addEventListener("DOMContentLoaded", () => {
elements.confirmBtn.addEventListener("click", async () => {
    
});
});

// Função para atualizar o status do bot
async function atualizarStatusBot() {
try {
  const response = await fetch("/bot-status");
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Erro desconhecido");

  const circle = document.getElementById("statusCircle");
  const text = document.getElementById("statusText");

  if (data.running) {
    circle.style.backgroundColor = "green";
    text.textContent = "Executando";
  } else {
    circle.style.backgroundColor = "red";
    text.textContent = "Parado";
  }
} catch (error) {
  console.error("Erro ao atualizar status do bot:", error);
}
}

// Adicionar eventos para o modal de confirmação de parada
if (confirmStopBtn && cancelStopBtn) {
  confirmStopBtn.addEventListener('click', function() {
    hideStopBotConfirmation();
    stopBot();
  });
  
  cancelStopBtn.addEventListener('click', function() {
    hideStopBotConfirmation();
  });
  
  // Fechar o modal ao clicar fora dele
  window.addEventListener('click', function(event) {
    if (event.target === stopBotConfirmationModal) {
      hideStopBotConfirmation();
    }
  });
}

// Atualiza ao carregar a página e a cada 15 segundos
window.addEventListener("load", () => {
  atualizarStatusBot();
  setInterval(atualizarStatusBot, 15000);
});


