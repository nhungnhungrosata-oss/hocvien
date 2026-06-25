const { setCors, generateAI, localEnhancement } = require('./_shared');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { prompt, action = 'optimize' } = body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt content' });

    let userPrompt = '';
    const system = 'Bạn là chuyên gia Prompt Engineer xuất sắc. Hãy cải thiện Prompt Master tiếng Việt, giữ đúng bản chất chuyên sâu, cấu trúc rõ ràng và định dạng Markdown.';
    if (action === 'shorten') userPrompt = `Hãy rút gọn Prompt Master sau, giữ nguyên vai trò, quy tắc cốt lõi và định dạng đầu ra. Chỉ trả về bản rút gọn:\n\n${prompt}`;
    else if (action === 'expand') userPrompt = `Hãy mở rộng Prompt Master sau cho chuyên sâu hơn, thêm hướng dẫn tư duy, tâm lý khách hàng và tính thực tế. Chỉ trả về bản mở rộng:\n\n${prompt}`;
    else if (action === 'chatgpt') userPrompt = `Hãy tối ưu Prompt Master sau để dùng hiệu quả với ChatGPT/GPTs, rõ vai trò, quy tắc, đầu ra và ví dụ. Chỉ trả về prompt đã tối ưu:\n\n${prompt}`;
    else if (action === 'gemini') userPrompt = `Hãy tối ưu Prompt Master sau để dùng hiệu quả trên Google Gemini, tận dụng ngữ cảnh dài và ranh giới quy tắc rõ ràng. Chỉ trả về prompt đã tối ưu:\n\n${prompt}`;
    else userPrompt = `Hãy tối ưu diễn đạt, sửa lỗi chính tả và làm Prompt Master sau mạch lạc, chuyên nghiệp hơn nhưng giữ nguyên dữ liệu cốt lõi:\n\n${prompt}`;

    try {
      const result = await generateAI(system, userPrompt, 0.35);
      return res.status(200).json({ result: result.trim() });
    } catch (err) {
      return res.status(200).json({ result: localEnhancement(prompt, action), isFallback: true, fallbackReason: err?.message || String(err) });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi hệ thống khi gọi AI: ' + (err?.message || String(err)) });
  }
};
