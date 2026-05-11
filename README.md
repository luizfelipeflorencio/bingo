# 🎱 Bingo Live

Uma plataforma de gerenciamento de Bingo em tempo real para jogos presenciais. O mestre sorteia as bolas físicas e as registra no sistema; todos os participantes conectados veem instantaneamente o número sorteado em suas telas, sem necessidade de atualizar a página.

![Bingo](https://img.shields.io/badge/Bingo-Live-blue?style=for-the-badge&logo=socket.io)
![NodeJS](https://img.shields.io/badge/Node.js-v22+-green?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/Express-v5-lightgrey?style=for-the-badge&logo=express)

---

## ✨ Funcionalidades

- **⚡ Real-time**: Sincronização instantânea via WebSockets (Socket.io).
- **📱 Mobile-first**: Interface responsiva para celulares, tablets e projetores.
- **🛡️ Persistência**: Estado do jogo salvo automaticamente (sobrevive a quedas de energia/servidor).
- **🔑 Autenticação do Host**: Apenas quem possui o segredo pode sortear números e reiniciar o jogo.
- **🔄 Zero Refresh**: O painel dos participantes atualiza sozinho.

## 🚀 Tecnologias

- **Backend**: Node.js, Express 5.
- **Comunicação**: Socket.io (Bi-direcional).
- **Frontend**: Vanilla JS (ES2022), CSS Moderno.
- **Estado**: JSON persistente no disco com throttle de escrita.

## 🛠️ Como rodar o projeto

### Pré-requisitos
- Node.js (Recomendado v22+)
- NPM

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/bingo-live.git
cd bingo-live
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz:
```env
PORT=3003
HOST_SECRET=seu_segredo_aqui
```

4. Inicie o servidor:
```bash
npm run dev
```

## 🎮 Como Usar

### 👨‍🏫 Painel do Host (Controle)
Acesse: `http://localhost:3003/host.html`

Para autenticar como Host, o sistema utiliza o `token` definido no seu `.env`. 
*(Nota: No código atual, a autenticação é feita via handshake do socket).*

### 👥 Painel do Participante (Visualização)
Acesse: `http://localhost:3003/`

Este painel mostra a bola atual em destaque, o histórico das últimas bolas e um tabuleiro completo com todos os números sorteados destacados.

---

## 🏗️ Estrutura do Projeto

```text
├── public/          # Frontend (HTML, CSS, JS)
│   ├── index.html   # Visão do Participante
│   ├── host.html    # Visão do Host
│   ├── app.js       # Lógica do Participante
│   ├── host.js      # Lógica do Host
│   └── style.css    # Estilização Global
├── server.js        # Servidor Express + Socket.io
├── gameState.json   # Estado persistido (gerado automaticamente)
└── package.json     # Dependências e Scripts
```

## 📝 Licença

Distribuído sob a licença ISC. Veja `LICENSE` para mais informações.

---
Desenvolvido com ❤️ para tornar as noites de Bingo mais tecnológicas! 🎱⚡
