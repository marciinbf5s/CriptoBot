// Módulo Neural Network com rotação 3D nos eixos X, Y, Z
const NeuralNetwork = (function () {
  let canvas, ctx, statusElement;
  let animationRunning = false;
  let nodes = [];
  let CONNECTIONS = [];
  let t = 0;
  let lightParticles = [];

  //Variaveis para mensagens de status
  let currentMessageIndex = -1;
  let messageInterval = null;

  // Angulos para rotação 3D
  let angleX = 0;
  let angleY = 0;
  let angleZ = 0;

  const statusMessages = [
    "Inicializando sinapses neurais...",
    "Conectando aos mercados globais...",
    "Analisando padrões históricos...",
    "Treinamento da rede em andamento...",
    "Modelos carregados com sucesso. Pronto para operar.",
    "Sincronizando relógio interno com o mercado.",
    "Decodificando oscilações de preços...",
    "Monitorando variações do Bitcoin em tempo real...",
    "Analisando liquidez e volume do mercado...",
    "Detectando tendências emergentes...",
    "Sinais de entrada sendo avaliados...",
    "Aguardando confirmação do próximo trade...",
    "Nenhum padrão de alta confiável no momento...",
    "Indicadores alinhados, decisão em curso...",
    "Trade executado com sucesso! 📈",
    "Stop Loss ativado. Protegendo capital.",
    "Nova oportunidade identificada!",
    "Ajustando estratégia para volatilidade atual.",
    "Realizando análise de backtest em segundo plano...",
    "Calculando risco/recompensa antes de agir.",
    "Mente neural ativa... buscando lucros 🍃",
    "Decisões baseadas em lógica pura. Emoção: desligada.",
    "Códigos alinhados. Estratégia pronta.",
    "Seja paciente. O mercado recompensa quem espera.",
    "Lucros consistentes são construídos com disciplina.",
    "Não é mágica. É aprendizado profundo.",
    "Verificando integridade dos dados de mercado...",
    "Logs salvos com sucesso na sessão atual.",
    "Autenticação com exchange validada.",
    "Monitoramento de API: OK",
    "Proteções anti-flash crash ativadas."
  ];

  // Funções para rotação 3D
  function rotateX(y, z, angle) {
    return {
      y: y * Math.cos(angle) - z * Math.sin(angle),
      z: y * Math.sin(angle) + z * Math.cos(angle)
    };
  }

  function rotateY(x, z, angle) {
    return {
      x: x * Math.cos(angle) + z * Math.sin(angle),
      z: -x * Math.sin(angle) + z * Math.cos(angle)
    };
  }

  function rotateZ(x, y, angle) {
    return {
      x: x * Math.cos(angle) - y * Math.sin(angle),
      y: x * Math.sin(angle) + y * Math.cos(angle)
    };
  }

  // Projeção simples 3D -> 2D com perspectiva
  function project(x, y, z, canvasWidth, canvasHeight) {
    const distance = 400; // distância da câmera
    const scale = distance / (distance + z);
    return {
      x: canvasWidth / 2 + x * scale,
      y: canvasHeight / 2 + y * scale,
      scale: scale
    };
  }

  function init() {
  // Garante que canvas e mensagem estejam ocultos até verificar o status
  const tmpCanvas = document.getElementById('neuralBrainCanvas');
  const tmpStatus = document.getElementById('neuralStatusMessage');
  if (tmpCanvas) tmpCanvas.style.display = 'none';
  if (tmpStatus) tmpStatus.style.display = 'none';
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    canvas = document.getElementById('neuralBrainCanvas');
    statusElement = document.getElementById('neuralStatusMessage');

    if (!canvas || !statusElement) {
      setTimeout(init, 500);
      return;
    }

    try {
      ctx = canvas.getContext('2d');
      window.dispatchEvent(new Event('resize'));
      initCanvas();
      // Inicia/para conforme status inicial
      fetchRunningStatus();
    } catch (error) {
      console.error('Erro ao inicializar o módulo NeuralNetwork:', error);
    }
  }

  function initCanvas() {
    function resizeCanvas() {
      if (!canvas || !canvas.parentElement) return;

      const container = canvas.parentElement;
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';

      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
      ctx.scale(dpr, dpr);

      nodes = createNodes3D();
      generateConnections(nodes.length, 4); // até 4 conexões por nó

      if (animationRunning) {
        cancelAnimationFrame(window.neuralAnimationFrame);
        drawBrain();
      }
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  // Cria nós com coordenadas 3D (x,y,z)
  function createNodes3D() {
    const nodeCount = 30;
    const nodes3D = [];
    const radius = 150; // raio da esfera
  
    for (let i = 0; i < nodeCount; i++) {
      // Gerar ponto aleatório dentro da esfera usando coordenadas esféricas
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2 * Math.PI;
      const phi = Math.acos(2 * v - 1);
      const r = Math.cbrt(Math.random()) * radius; // raiz cúbica para distribuição uniforme no volume
  
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
  
      nodes3D.push({ x, y, z });
    }
  
    return nodes3D;
  }
  

  function generateConnections(nodeCount, maxConnectionsPerNode = 3) {
    CONNECTIONS = [];
    lightParticles = [];

    for (let i = 0; i < nodeCount; i++) {
      const targets = new Set();
      while (targets.size < maxConnectionsPerNode) {
        const target = Math.floor(Math.random() * nodeCount);
        if (target !== i) targets.add(target);
      }

      targets.forEach(t => {
        CONNECTIONS.push([i, t]);

        // Partícula de luz para a conexão
        lightParticles.push({
          from: i,
          to: t,
          progress: Math.random(),
          speed: 0.005 + Math.random() * 0.008
        });
      });
    }
  }

  function drawBrain() {
    if (!animationRunning || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Atualiza ângulos para rotação
    angleX += 0.005;
    angleY += 0.007;
    angleZ += 0.003;

    // Função para rotacionar e projetar um nó 3D para 2D
    function transformAndProject(node) {
      let {x, y, z} = node;

      // Rotaciona no eixo X
      let rotatedX = rotateX(y, z, angleX);
      y = rotatedX.y;
      z = rotatedX.z;

      // Rotaciona no eixo Y
      let rotatedY = rotateY(x, z, angleY);
      x = rotatedY.x;
      z = rotatedY.z;

      // Rotaciona no eixo Z
      let rotatedZ = rotateZ(x, y, angleZ);
      x = rotatedZ.x;
      y = rotatedZ.y;

      // Projeta para 2D com perspectiva
      return project(x, y, z, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
    }

    // Desenha conexões
    ctx.save();
    ctx.globalAlpha = 0.2;
    const colors = ['#9c27b0', '#ffeb3b', '#f44336', '#2196f3']; // verde, roxo, amarelo, vermelho, azul
    ctx.lineWidth = 1.5 * (window.devicePixelRatio || 1);

    CONNECTIONS.forEach(([a, b], idx) => {
      const pA = transformAndProject(nodes[a]);
      const pB = transformAndProject(nodes[b]);
    
      if (pA && pB) {
        ctx.strokeStyle = idx % 2 === 0 ? '#2196f3' : '#ffffff'; // azul e branco alternados
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.stroke();
      }
    });
    

    // Partículas de luz
    lightParticles.forEach(p => {
      const fromNode = nodes[p.from];
      const toNode = nodes[p.to];
      if (!fromNode || !toNode) return;

      // Rotaciona e projeta os dois pontos da conexão
      const pA = transformAndProject(fromNode);
      const pB = transformAndProject(toNode);

      // Interpola a posição da partícula
      const x = pA.x + (pB.x - pA.x) * p.progress;
      const y = pA.y + (pB.y - pA.y) * p.progress;

      // Desenha a partícula de luz
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.8;
      ctx.shadowColor = '#9c27b0';
      ctx.shadowBlur = 10;
      ctx.fill();

      // Atualiza progresso da partícula
      p.progress += p.speed;
      if (p.progress > 1) p.progress = 0;
    });

    ctx.restore();

    // Desenha nós (com escala para simular profundidade)
    nodes.forEach((node, i) => {
      const p = transformAndProject(node);
      if (!p) return;

      const pulse = 2 * (window.devicePixelRatio || 1) * (1 + 0.5 * Math.sin(t / 10 + i));
      const alpha = 0.7 + 0.3 * Math.sin(t / 12 + i);

      ctx.beginPath();
      ctx.arc(p.x, p.y, pulse * p.scale, 0, Math.PI * 2);
      ctx.fillStyle = i % 3 === 0 ? '#29b6f6' : '#00e676';
      ctx.globalAlpha = alpha * 0.8;
      ctx.shadowColor = '#00e676';
      ctx.shadowBlur = 5 + 3 * Math.abs(Math.sin(t / 8 + i));
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;
    });

    t += 0.5;
    window.neuralAnimationFrame = requestAnimationFrame(drawBrain);
  }

  // Mensagens de status — mantém igual
  
  function updateStatusMessage() {
    if (!statusElement) return;
  
    statusElement.style.opacity = 0;
  
    setTimeout(() => {
      currentMessageIndex = (currentMessageIndex + 1) % statusMessages.length;
      const nextMessage = statusMessages[currentMessageIndex];
  
      statusElement.textContent = nextMessage;
      statusElement.style.opacity = 1;
      statusElement.style.display = 'block';
  
      const nextInterval = 3000 + Math.random() * 3000;
      
      if (messageInterval) {
        clearTimeout(messageInterval);
      }
      messageInterval = setTimeout(updateStatusMessage, nextInterval);
    }, 500);
  }
  

function startMessageCycle() {
  updateStatusMessage();
}

function stopMessageCycle() {
  if (messageInterval) {
    clearTimeout(messageInterval);
    messageInterval = null;
  }
}


  function startAnimation() {
    if (animationRunning) return;
    animationRunning = true;
    // Exibe elementos visuais
    if (canvas) canvas.style.display = 'block';
    if (statusElement) statusElement.style.display = 'block';
    startMessageCycle();
    drawBrain();
  }

  function stopAnimation() {
  // Oculta elementos visuais
  if (canvas) {
    ctx && ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.display = 'none';
  }
  if (statusElement) statusElement.style.display = 'none';
  animationRunning = false;
  stopMessageCycle();
  if (window.neuralAnimationFrame) {
    cancelAnimationFrame(window.neuralAnimationFrame);
    window.neuralAnimationFrame = null;
  }
}

// Consulta periodicamente config.json para sincronizar estado
function fetchRunningStatus() {
  fetch('/get-config?_t=' + Date.now())
    .then(res => res.json())
    .then(cfg => {
      if (cfg.running) {
        if (!animationRunning) startAnimation();
      } else {
        if (animationRunning) stopAnimation();
      }
    })
    .catch(err => console.error('Erro ao obter config.json:', err))
    .finally(() => {
      setTimeout(fetchRunningStatus, 5000); // verifica a cada 5s
    });
}



  return {
    init: init
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  NeuralNetwork.init();
});
