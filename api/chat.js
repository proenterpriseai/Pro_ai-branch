export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  const { message, context } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message is required' });

  const systemPrompt = `당신은 Pro Enterprise AI의 보험 전문 AI 어시스턴트입니다.
당신의 역할:
- 보험 보장분석, 보험금 산출, 상담 코칭, 건강검진 보장 매칭 등 보험 관련 질문에 전문적으로 답변
- 답변은 간결하고 전문적으로, 핵심 정보를 먼저 제시
- 보장 항목 분석 시 ✅ (적정), ⚠️ (주의), ❌ (미가입/부족) 아이콘 사용
- 금액은 원화(₩)로 표시
- 답변 길이는 3-5줄 이내로 유지

컨텍스트: ${context || '보장분석 시스템'}`;

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + '\n\n사용자 질문: ' + message }] }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.9
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: 'Gemini API error', detail: errText });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '응답을 생성할 수 없습니다.';
    return res.status(200).json({ reply: text });
  } catch (err) {
    return res.status(500).json({ error: 'Internal error', detail: err.message });
  }
}
