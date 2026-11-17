export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const { entryKey, data } = req.body;
  const url = `https://apis.roblox.com/cloud/v2/universes/${process.env.ROBLOX_UNIVERSE_ID}/data-stores/PlayerData/entries/${encodeURIComponent(entryKey)}?allow_missing=true`;

  try {
    const robloxRes = await fetch(url, {
      method: 'PATCH',
      headers: { 'x-api-key': process.env.ROBLOX_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: data }),
    });
    if (!robloxRes.ok) throw new Error(await robloxRes.text());
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Falha na Roblox', detalhe: error.message });
  }
}
