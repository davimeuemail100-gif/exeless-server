const WebSocket = require('ws');
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Exeless Server Online\n');
});

const wss = new WebSocket.Server({ server });
const salas = new Map();

wss.on('connection', (ws, req) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // Multiplayer (Mover)
      if (data.tipo === 'mover') {
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      }

      // Voice Chat - Gerar Código (Celular)
      if (data.tipo === 'gerar_codigo') {
        const codigo = Math.random().toString(36).substring(2, 7).toUpperCase();
        salas.set(codigo, { wsCelular: ws, ip: ip });
        ws.send(JSON.stringify({ tipo: 'codigo_gerado', codigo: codigo }));
      }

      // Voice Chat - Conectar (TV)
      if (data.tipo === 'conectar_codigo') {
        const sala = salas.get(data.codigo);
        if (sala && sala.ip === ip) {
          sala.wsTv = ws;
          sala.wsCelular.send(JSON.stringify({ tipo: 'tv_conectada', codigo: data.codigo }));
          ws.send(JSON.stringify({ tipo: 'sucesso_conexao', codigo: data.codigo }));
        } else {
          ws.send(JSON.stringify({ tipo: 'erro', msg: 'Código errado ou redes diferentes.' }));
        }
      }

      // Voice Chat - WebRTC
      if (data.tipo === 'offer' || data.tipo === 'answer' || data.tipo === 'ice') {
        const sala = salas.get(data.codigo);
        if (sala) {
          const destinatario = data.remetente === 'celular' ? sala.wsTv : sala.wsCelular;
          if (destinatario && destinatario.readyState === WebSocket.OPEN) {
            destinatario.send(JSON.stringify(data));
          }
        }
      }
    } catch (e) {
      console.log('Erro:', e);
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Servidor Exeless rodando na porta ${PORT}`);
});
