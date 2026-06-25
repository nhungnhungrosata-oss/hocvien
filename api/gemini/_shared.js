function splitKeys(value) {
  if (!value || typeof value !== 'string' || value.includes('MY_')) return [];
  return value.split(',').map((x) => x.trim()).filter(Boolean);
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function geminiKeys() {
  const keys = [
    ...splitKeys(process.env.GEMINI_API_KEY),
    ...splitKeys(process.env.GEMINI_API_KEYS),
    ...splitKeys(process.env.VITE_GEMINI_API_KEY),
  ];
  for (let i = 1; i <= 10; i++) keys.push(...splitKeys(process.env[`GEMINI_API_KEY_${i}`]));
  return unique(keys);
}

function deepseekKeys() {
  const keys = [
    ...splitKeys(process.env.DEEPSEEK_API_KEY),
    ...splitKeys(process.env.DEEPSEEK_API_KEYS),
  ];
  for (let i = 1; i <= 10; i++) keys.push(...splitKeys(process.env[`DEEPSEEK_API_KEY_${i}`]));
  return unique(keys);
}

function localSuggestion(fieldKey, formData = {}) {
  const brandName = (formData.brandName || '').trim();
  const industry = (formData.industry || '').trim();
  const nicheTopic = (formData.nicheTopic || '').trim();
  const mainProduct = (formData.mainProduct || '').trim();
  const targetAudience = (formData.targetAudience || '').trim();
  switch (fieldKey) {
    case 'userRole': return `Chuyên gia tư vấn thương hiệu ${brandName || 'doanh nghiệp'} giàu kinh nghiệm trong lĩnh vực ${industry || 'chuyên ngành'}.`;
    case 'nicheTopic': return `Sáng tạo nội dung chuyên sâu, dễ hiểu và có tính ứng dụng trong ngành ${industry || 'sản phẩm/dịch vụ'}.`;
    case 'mainProduct': return `Các sản phẩm/dịch vụ cốt lõi của ${brandName || 'thương hiệu'}, tập trung vào chất lượng, sự phù hợp và trải nghiệm khách hàng.`;
    case 'strengths': return 'Tư vấn tận tâm, hiểu khách hàng, nội dung thực tế, có quy trình rõ ràng và ưu tiên giải pháp an toàn, bền vững.';
    case 'targetAudience': return `Nhóm khách hàng quan tâm đến ${nicheTopic || industry || 'giải pháp phù hợp'}, mong muốn thông tin dễ hiểu, đáng tin cậy và thực tế.`;
    case 'customerPainPoints': return 'Bị quá tải trước nhiều thông tin trái chiều; lo chọn sai sản phẩm/dịch vụ; thiếu người tư vấn rõ ràng, dễ hiểu và đáng tin cậy.';
    case 'customerDesires': return 'Muốn tìm được hướng đi phù hợp, an toàn, tiết kiệm thời gian và có người đồng hành hướng dẫn đúng cách.';
    case 'customerBarriers': return `Còn e ngại chi phí, sợ hiệu quả không như kỳ vọng, thiếu niềm tin vì từng nghe nhiều lời quảng cáo phóng đại về ${mainProduct || 'giải pháp'}.`;
    case 'customerMisconceptions': return `Nghĩ rằng chỉ cần chọn giải pháp nổi tiếng hoặc đắt tiền là phù hợp, trong khi bỏ qua nhu cầu của ${targetAudience || 'khách hàng'}.`;
    case 'mustHaves': return 'Luôn có hook rõ ràng, nội dung dễ hiểu, ví dụ thực tế, lời khuyên an toàn và CTA mềm để mời khách hàng trao đổi thêm.';
    case 'thingsToAvoid': return 'Tránh cam kết tuyệt đối, tránh thổi phồng công dụng, tránh hạ thấp đối thủ và tránh dùng ngôn ngữ gây hiểu nhầm về hiệu quả.';
    case 'forbiddenKeywords': return 'cam kết khỏi 100%, dứt điểm, trị tận gốc, thuốc thần kỳ, hiệu quả tức thì';
    case 'replacementKeywords': return 'hỗ trợ cải thiện dần, góp phần chăm sóc, giải pháp hỗ trợ an toàn, hướng chăm sóc đúng cách';
    default: return '';
  }
}

function localEnhancement(prompt, action) {
  const cleaned = String(prompt || '').trim();
  if (!cleaned) return '';
  if (action === 'shorten') return cleaned.split('\n').filter((x) => x.trim() && !x.includes('BỔ SUNG')).join('\n') + '\n\n*(Đã rút gọn bằng chế độ dự phòng cục bộ.)*';
  if (action === 'expand') return cleaned + '\n\n## BỔ SUNG CHUYÊN SÂU\n- Phân tích kỹ bối cảnh khách hàng trước khi viết.\n- Ưu tiên ví dụ thực tế, ngôn ngữ tự nhiên và CTA mềm.\n- Kiểm tra từ khóa nhạy cảm trước khi xuất bản.';
  if (action === 'chatgpt') return cleaned + '\n\n## TỐI ƯU CHO CHATGPT\n- Trả lời bằng Markdown rõ ràng.\n- Hỏi lại khi thiếu dữ liệu quan trọng.\n- Giữ văn phong tự nhiên, tránh sáo rỗng.';
  if (action === 'gemini') return cleaned + '\n\n## TỐI ƯU CHO GEMINI\n- Tận dụng ngữ cảnh dài.\n- Tự rà soát tính nhất quán trước khi trả lời.\n- Giữ đúng ranh giới từ khóa an toàn.';
  return cleaned + '\n\n## TỐI ƯU DIỄN ĐẠT\n- Diễn đạt mạch lạc hơn, rõ vai trò hơn và giữ nguyên các dữ liệu cốt lõi đã nhập.';
}

async function callGemini(systemInstruction, userPrompt, temperature = 0.5) {
  const keys = geminiKeys();
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest'];
  let lastError = null;
  for (const key of keys) {
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: { temperature }
          })
        });
        if (!response.ok) throw new Error(`Gemini ${model} HTTP ${response.status}: ${await response.text()}`);
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
        if (text) return text;
      } catch (err) { lastError = err; }
    }
  }
  throw lastError || new Error('Không có phản hồi Gemini');
}

async function callDeepSeek(systemInstruction, userPrompt, temperature = 0.5) {
  const keys = deepseekKeys();
  let lastError = null;
  for (const key of keys) {
    for (const endpoint of ['https://api.deepseek.com/chat/completions', 'https://api.deepseek.com/v1/chat/completions']) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'system', content: systemInstruction }, { role: 'user', content: userPrompt }], temperature, max_tokens: 3000 })
        });
        if (!response.ok) throw new Error(`DeepSeek HTTP ${response.status}: ${await response.text()}`);
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      } catch (err) { lastError = err; }
    }
  }
  throw lastError || new Error('Không có phản hồi DeepSeek');
}

async function generateAI(systemInstruction, userPrompt, temperature = 0.5) {
  if (geminiKeys().length) return callGemini(systemInstruction, userPrompt, temperature);
  if (deepseekKeys().length) return callDeepSeek(systemInstruction, userPrompt, temperature);
  throw new Error('NO_API_KEYS_CONFIGURED');
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
}

module.exports = { setCors, generateAI, localSuggestion, localEnhancement };
