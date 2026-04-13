export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.NOTION_TOKEN;
  const dbId = process.env.NOTION_DB_ID;

  if (!token || !dbId) {
    return res.status(500).json({ error: 'NOTION_TOKEN 또는 NOTION_DB_ID 환경변수가 없어요.' });
  }

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ page_size: 100 }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.message || '노션 API 오류' });
    }

    const data = await response.json();

    const events = data.results.map(page => {
      const props = page.properties;
      const name = props['브랜드/제품 명']?.title?.[0]?.plain_text || '제목 없음';
      const dateStart = props['시작 날짜']?.date?.start || null;
      const dateEnd = props['종료 날짜']?.date?.start || null;
      const type = props['유형']?.select?.name || null;
      const status = props['상태']?.select?.name || null;
      const important = status === '진행중';

      return { name, date: dateStart, dateEnd, type, status, important };
    }).filter(e => e.date);

    return res.status(200).json({ events });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
