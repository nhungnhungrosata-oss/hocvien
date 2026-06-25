const { setCors, generateAI, localSuggestion } = require('./_shared');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { fieldKey, formData } = body;
    if (!fieldKey || !formData) return res.status(400).json({ error: 'Thiếu thông tin yêu cầu' });

    const fieldNames = {
      userRole: 'Vai trò trên hệ thống khi AI xưng hô',
      nicheTopic: 'Chuyên đề hoặc ngách cụ thể',
      mainProduct: 'Sản phẩm hoặc dịch vụ chính',
      strengths: 'Điểm mạnh vượt trội',
      targetAudience: 'Khách hàng mục tiêu',
      customerPainPoints: 'Nỗi đau lớn nhất của khách hàng',
      customerDesires: 'Mong muốn sâu xa của khách hàng',
      customerBarriers: 'Rào cản khiến khách hàng chần chừ',
      customerMisconceptions: 'Hiểu sai phổ biến của khách hàng',
      mustHaves: 'Điều bắt buộc phải có trong nội dung',
      thingsToAvoid: 'Những chi tiết cần tránh',
      forbiddenKeywords: 'Từ khóa không được phép dùng',
      replacementKeywords: 'Từ khóa dùng để thay thế'
    };

    const system = `Bạn là trợ lý copywriting tiếng Việt. Hãy gợi ý ngắn gọn, tự nhiên, chuyên nghiệp cho trường "${fieldNames[fieldKey] || fieldKey}". Chỉ trả về nội dung gợi ý, không Markdown, không lời dẫn.`;
    const userPrompt = `Dữ liệu hiện có:\n${JSON.stringify(formData, null, 2)}\n\nHãy gợi ý nội dung phù hợp cho trường: ${fieldNames[fieldKey] || fieldKey}.`;

    try {
      const suggestion = await generateAI(system, userPrompt, 0.7);
      return res.status(200).json({ suggestion: suggestion.trim() });
    } catch (err) {
      return res.status(200).json({ suggestion: localSuggestion(fieldKey, formData), isFallback: true, fallbackReason: err?.message || String(err) });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Không thể lấy gợi ý: ' + (err?.message || String(err)) });
  }
};
