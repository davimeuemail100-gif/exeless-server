import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { action, username, password } = req.body;

  if (action === 'register') {
    if (username.includes(' ')) return res.status(400).json({ error: 'Sem espaços no nome.' });
    if (username === 'Exeless') return res.status(400).json({ error: 'Nome reservado para o Admin.' });

    const userExists = await kv.get(`user:${username}`);
    if (userExists) return res.status(400).json({ error: 'Nome já cadastrado!' });

    const newUser = { username, password, isAdmin: false, friends: ['Exeless'] };
    await kv.set(`user:${username}`, JSON.stringify(newUser));

    const adminData = await kv.get('user:Exeless');
    if (adminData) {
      const admin = JSON.parse(adminData);
      if (admin.friends.length < 1000) {
        admin.friends.push(username);
        await kv.set('user:Exeless', JSON.stringify(admin));
      }
    }
    return res.status(200).json({ ok: true, isAdmin: false });
  }

  if (action === 'login') {
    const userData = await kv.get(`user:${username}`);
    if (!userData) return res.status(400).json({ error: 'Usuário não encontrado.' });
    const user = JSON.parse(userData);
    if (user.password !== password) return res.status(400).json({ error: 'Senha incorreta.' });
    return res.status(200).json({ ok: true, isAdmin: user.isAdmin, username: user.username });
  }
  return res.status(400).json({ error: 'Ação inválida' });
}
