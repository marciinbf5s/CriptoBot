# 📊 Bot Cripto- Plataforma de Análise de Mercado

<div align="center">
  <img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow" alt="Status">
  <img src="https://img.shields.io/badge/Python-3.9+-blue" alt="Python">
  <img src="https://img.shields.io/badge/Flask-2.0+-blue" alt="Flask">
  <img src="https://img.shields.io/badge/Licença-MIT-green" alt="License">
</div>

Bem-vindo ao The Best Trader, uma plataforma web para análise de mercado e visualização de dados financeiros em tempo real, desenvolvida com Python e Flask.

🔗 **Acesse a aplicação em produção:** [https://thebesttrader.onrender.com/](https://thebesttrader.onrender.com/)

## 🖼️ Demonstração


## ✨ Recursos Principais

- 📈 Visualização de dados de criptomoedas em tempo real
- 🔍 Análise técnica com múltiplos indicadores
- 📱 Interface responsiva e intuitiva
- 🔒 Autenticação segura de usuários
- 🌐 Suporte a múltiplas exchanges

## 🚀 Começando

### 📋 Pré-requisitos

- Python 3.9 ou superior
- pip (gerenciador de pacotes Python)
- Git (para clonar o repositório)
- Conta na Binance (opcional para dados em tempo real)

### 🛠️ Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/thebesttrader.git
   cd thebesttrader
   ```

2. **Crie e ative o ambiente virtual**
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate
   
   # Linux/MacOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Instale as dependências**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

## 🚦 Iniciando a Aplicação

1. **Inicie o servidor de desenvolvimento**
   ```bash
   cd src
   python app.py
   ```

2. **Acesse a aplicação**
   Abra seu navegador e acesse: [http://localhost:5000](http://localhost:5000)

## 🏗️ Estrutura do Projeto

```
thebesttrader/
├── src/
│   ├── app/                 # Código-fonte principal
│   │   ├── static/          # Arquivos estáticos (CSS, JS, imagens)
│   │   ├── templates/       # Templates HTML
│   │   ├── __init__.py
│   │   └── routes.py        # Rotas da aplicação
│   ├── config/              # Arquivos de configuração
│   └── utils/               # Utilitários e helpers
├── tests/                   # Testes automatizados
├── .env.example             # Exemplo de variáveis de ambiente
├── requirements.txt         # Dependências do projeto
└── README.md               # Este arquivo
```

## 🌐 Deploy

### Render (Recomendado)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. Crie uma conta no [Render](https://render.com/)
2. Conecte seu repositório
3. Configure as variáveis de ambiente
4. Clique em "Deploy"

### Outras Opções
- **Heroku**
- **AWS Elastic Beanstalk**
- **Google Cloud Run**

## 🤝 Contribuição

Contribuições são bem-vindas! Siga estes passos:

1. Faça um Fork do projeto
2. Crie uma Branch (`git checkout -b feature/AmazingFeature`)
3. Faça o Commit das suas alterações (`git commit -m 'Add some AmazingFeature'`)
4. Faça o Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

## 📞 Contato
Email: marciodanielsaxalto@gmail.com


