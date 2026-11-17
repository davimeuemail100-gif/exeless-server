import { kv } from '@vercel/kv';
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { action, username, friendUsername } = req.body;
  const userData = await kv.get(`user:${username}`);
  if (!userData) return res.status(404).json({ error: 'Usuário não encontrado.' });
  const user = JSON.parse(userData);

  if (action === 'add') {
    const friendData = await kv.get(`user:${friendUsername}`);
    if (!friendData) return res.status(404).json({ error: 'Jogador não encontrado.' });
    const friend = JSON.parse(friendData);
    if (user.friends.includes(friendUsername)) return res.status(400).json({ error: 'Já são amigos!' });

    const maxLimit = user.isAdmin ? 1000 : 100;
    if (user.friends.length >= maxLimit) return res.status(400).json({ error: `Limite de ${maxLimit} amigos atingido!` });

    user.friends.push(friendUsername);
    friend.friends.push(username);
    await kv.set(`user:${username}`, JSON.stringify(user));
    await kv.set(`user:${friendUsername}`, JSON.stringify(friend));
    return res.status(200).json({ ok: true, friends: user.friends });
  }
  if (action === 'list') return res.status(200).json({ ok: true, friends: user.friends });
  return res.status(400).json({ error: 'Ação inválida' });
}
