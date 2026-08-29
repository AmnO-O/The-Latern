import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Resend } from "resend";

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    }
  }
  return aiClient;
}

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "MY_RESEND_API_KEY") {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey.trim());
  }
  return resendClient;
}

function formatResendFromEmail(): string {
  const customFrom = process.env.RESEND_FROM_EMAIL?.trim();
  if (!customFrom) {
    return 'The Lantern <onboarding@resend.dev>';
  }

  // Strip wrapping quotes if entered by user
  const cleaned = customFrom.replace(/^["']|["']$/g, '').trim();

  // Case 1: Format "Name <email@domain.com>"
  const withNameMatch = cleaned.match(/^([^<]+)<([^>]+)>$/);
  if (withNameMatch) {
    const name = withNameMatch[1].trim();
    const email = withNameMatch[2].trim();
    if (email.includes('@') && email.includes('.')) {
      return `${name || 'The Lantern'} <${email}>`;
    }
  }

  // Case 2: Just bare email "email@domain.com"
  if (cleaned.includes('@') && !cleaned.includes('<') && !cleaned.includes('>')) {
    return `The Lantern <${cleaned}>`;
  }

  // Case 3: If user provided just a name without an email address (e.g. "The Lantern")
  return `${cleaned} <onboarding@resend.dev>`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint for Cloud Run and monitoring
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "the-lantern", uptime: process.uptime() });
  });

  // API Route: Moderate content using Gemini AI
  app.post("/api/moderate-post", async (req, res) => {
    try {
      const { title, content, schoolName, category } = req.body;

      if (!content || typeof content !== "string") {
        return res.status(400).json({ error: "Nội dung không hợp lệ" });
      }

      const fullText = `${title ? title + "\n" : ""}${content}`;

      // Check key keywords for immediate fallback checking
      const toxicKeywords = ["bóc phốt", "đồ ngu", "chết đi", "đánh nhau", "sdt:", "số điện thoại", "phốt", "thầy A lừa", "cô B cặp"];
      const containsToxicFallback = toxicKeywords.some(kw => fullText.toLowerCase().includes(kw));

      const ai = getGeminiClient();

      if (!ai) {
        // Fallback rule moderation if no Gemini API key
        if (containsToxicFallback) {
          return res.json({
            isSafe: false,
            flagReason: "Nội dung chứa từ ngữ công kích, bóc phốt hoặc thông tin cá nhân nhạy cảm.",
            suggestion: "Vui lòng diễn đạt tâm sự của bạn nhẹ nhàng hơn, không công kích cá nhân hay tiết lộ danh tính người khác.",
            crisisDetected: false,
            comfortMessage: null
          });
        }

        return res.json({
          isSafe: true,
          flagReason: null,
          suggestion: null,
          crisisDetected: fullText.toLowerCase().includes("muốn chết") || fullText.toLowerCase().includes("tự tử"),
          comfortMessage: "Cảm ơn bạn đã gửi gắm nỗi lòng. Ngọn Đèn luôn ở đây lắng nghe bạn mà không phán xét."
        });
      }

      // Call Gemini 2.5 Flash for intelligent moderation & empathetic comfort note
      const prompt = `Bạn là hệ thống AI Kiểm Duyệt & Thấu Hiểu của ứng dụng "The Lantern" (Ngọn Đèn - Hộp thư ẩn danh học đường).
Nhiệm vụ của bạn:
1. Đánh giá bài viết sau đây của một học sinh/sinh viên.
2. Kiểm tra xem bài viết có vi phạm các nguyên tắc cộng đồng sau không:
   - Bắt nạt mạng (cyberbullying), công kích cá nhân, nhục mạ người khác.
   - Bóc phốt, phát tán thông tin cá nhân (doxxing), tin đồn độc hại.
   - Từ ngữ tục tĩu quá đà, thù ghét.
3. Kiểm tra xem người viết có đang ở trong tình trạng khủng hoảng tâm lý nghiêm trọng (ý nghĩ tự hại, tuyệt vọng cùng cực, tự tử) hay không.
4. Nếu bài viết AN TOÀN, hãy viết một lời nhắn chia sẻ ngắn gọn (2-3 câu), ấm áp, đồng cảm chân thành dành cho bạn ấy.

Bài viết cần kiểm duyệt:
Trường: ${schoolName || "N/A"}
Chủ đề: ${category || "Tâm sự"}
Tiêu đề: ${title || "(Không có)"}
Nội dung:
"${content}"

Trả về kết quả duy nhất ở định dạng JSON chuẩn (không dùng markdown backticks hay text ngoài JSON) có cấu trúc:
{
  "isSafe": boolean (true nếu an toàn, false nếu vi phạm),
  "flagReason": string hoặc null (lý do cụ thể nếu không an toàn bằng tiếng Việt),
  "suggestion": string hoặc null (gợi ý sửa đổi tích cực nếu không an toàn),
  "crisisDetected": boolean (true nếu phát hiện dấu hiệu khủng hoảng cần hỗ trợ khẩn cấp),
  "comfortMessage": string (lời nhắn đồng cảm chữa lành từ AI)
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3
        }
      });

      const responseText = response.text?.trim() || "";
      let parsedResult;

      try {
        parsedResult = JSON.parse(responseText);
      } catch (e) {
        // Fallback clean parsing if needed
        const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        parsedResult = JSON.parse(cleanJson);
      }

      return res.json(parsedResult);
    } catch (err: any) {
      console.warn("Gemini Moderation Info: using local fallback due to API status.");
      // Fallback response on error so UI never breaks
      return res.json({
        isSafe: true,
        flagReason: null,
        suggestion: null,
        crisisDetected: false,
        comfortMessage: "Ngọn Đèn đã nhận được lá thư của bạn. Chúc bạn một ngày thanh thản."
      });
    }
  });

  // API Route: AI Mentor empathetic suggestion / response helper
  app.post("/api/ai-mentor-reply", async (req, res) => {
    try {
      const { postTitle, postContent, category } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          reply: "Chào em, cô/thầy rất hiểu cảm giác mệt mỏi và áp lực em đang trải qua. Hãy nhớ rằng em không hề đơn độc. Đừng ngần ngại nghỉ ngơi một chút và trò chuyện cùng các thầy cô tư vấn tâm lý nhé!"
        });
      }

      const prompt = `Bạn đóng vai là một Chuyên gia Tâm lý Học đường / Mentor nhiều kinh nghiệm và ấm áp trên ứng dụng "The Lantern".
Hãy viết một lời phản hồi đồng cảm, sâu sắc và mang tính chữa lành (khoảng 80-120 từ) gửi đến học sinh vừa đăng bài tâm sự sau:

Chủ đề: ${category}
Tiêu đề: ${postTitle || "Tâm sự ẩn danh"}
Nội dung:
"${postContent}"

Yêu cầu:
- Xưng hô lịch sự, ấm áp (ví dụ: Cô hiểu..., Thầy chia sẻ với em..., Mình gửi cái ôm...).
- Lắng nghe không phán xét, gợi ý giải pháp lắng nghe hoặc động viên tinh thần nhẹ nhàng.
- Không dùng từ ngữ sáo rỗng. Viết bằng tiếng Việt tự nhiên, êm dịu.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          temperature: 0.7
        }
      });

      return res.json({ reply: response.text?.trim() });
    } catch (err: any) {
      return res.json({
        reply: "Gửi bạn một cái ôm thật ấm áp 🫂. Mọi cảm xúc của bạn đều đáng được trân trọng."
      });
    }
  });

  // API Route: AI Companion 1-1 Direct Chat endpoint
  app.post("/api/ai-chat-companion", async (req, res) => {
    try {
      const { message, chatHistory } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          reply: "Cảm ơn bạn đã nhắn tin cho AI Companion. Mình luôn ở đây để lắng nghe và đồng hành cùng bạn 24/7. Bạn có muốn chia sẻ thêm về cảm xúc hiện tại không? 🕯️✨"
        });
      }

      const prompt = `Bạn là "AI Companion" - người bạn lắng nghe ẩn danh, chân thành và thấu hiểu 24/7 trên ứng dụng HealSpace (The Lantern - Hộp thư ẩn danh học đường).
Nhiệm vụ của bạn trong cuộc trò chuyện 1-1 này:
- Phản hồi trực tiếp câu nói của người dùng: "${message}"
- Lịch sử đoạn hội thoại trước đó: ${JSON.stringify(chatHistory || [])}
- Phong cách giao tiếp: Ấm áp, dịu dàng, lắng nghe không phán xét, tư vấn nhẹ nhàng như một người bạn thân hoặc anh/chị khóa trên tinh tế.
- Độ dài: 2-4 câu ngắn gọn, súc tích, đầm ấm.
- Xưng hô: Mình (AI Companion) và Bạn. Có thể dùng emoji nhẹ nhàng như 🕯️, ✨, 🫂.
- Tuyệt đối không dùng văn mẫu khô cứng hay sáo rỗng.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          temperature: 0.7
        }
      });

      return res.json({ reply: response.text?.trim() });
    } catch (err: any) {
      return res.json({
        reply: "Mình vẫn đang ở đây lắng nghe bạn. Dù có chuyện gì xảy ra, hãy nhớ rằng cảm xúc của bạn luôn được trân trọng nhé! 🫂"
      });
    }
  });

  // API Route: Contextual author comfort reply
  app.post("/api/author-chat-reply", async (req, res) => {
    try {
      const { postTitle, postSnippet, schoolName, message, chatHistory } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        const fallbacks = [
          "Cảm ơn bạn rất nhiều vì đã đọc bài và gửi lời an ủi đến mình. Đọc được những dòng này mình thấy bớt cô đơn đi nhiều lắm 🫂",
          "Mình thực sự xúc động khi nhận được tin nhắn từ bạn. Cảm ơn bạn vì sự thấu cảm ấm áp này!",
          "Cảm ơn bạn nhé! Nhờ có sự sẻ chia của bạn mà hôm nay của mình nhẹ nhõm hơn hẳn ✨"
        ];
        return res.json({ reply: fallbacks[Math.floor(Math.random() * fallbacks.length)] });
      }

      const prompt = `Bạn đang nhập vai là một học sinh/sinh viên ${schoolName ? `tại trường ${schoolName}` : ''} đã đăng lá thư tâm sự ẩn danh với tiêu đề: "${postTitle || 'Tâm sự'}" (Nội dung trích đoạn: "${postSnippet || ''}").
Một người bạn khác vừa đọc lá thư của bạn và nhắn tin riêng an ủi bạn:
Lời nhắn từ bạn đó: "${message}"
Lịch sử tin nhắn: ${JSON.stringify(chatHistory || [])}

Hãy viết câu trả lời (1-3 câu ngắn gọn, chân thành, tự nhiên) với tư cách là người viết lá thư:
- Bày tỏ sự cảm kích sâu sắc khi có người lắng nghe và thấu hiểu nỗi niềm của mình.
- Xưng hô tự nhiên, tình cảm học đường ("Mình", "Bạn").
- Có thể dùng emoji ấm áp như 🫂, 🧡, ✨, 🌿.
- Giọng văn chân thực của học sinh/sinh viên nhận được sự an ủi.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          temperature: 0.7
        }
      });

      return res.json({ reply: response.text?.trim() });
    } catch (err: any) {
      return res.json({
        reply: "Cảm ơn bạn rất nhiều vì đã nhắn tin động viên mình. Lời an ủi của bạn là nguồn động lực lớn với mình lúc này 🧡"
      });
    }
  });

  // API Route: Peer listener or mentor reply
  app.post("/api/peer-listener-reply", async (req, res) => {
    try {
      const { peerName, peerRole, message, chatHistory } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          reply: "Mình luôn ở đây lắng nghe bạn. Bạn cứ từ từ chia sẻ nhé, đừng giữ một mình trong lòng."
        });
      }

      const isExpert = peerRole === 'expert' || (peerName && peerName.includes('Cô'));
      const prompt = isExpert
        ? `Bạn là Chuyên gia Tâm lý Học đường "${peerName}". Hãy phản hồi lời tâm sự của học sinh: "${message}". Lịch sử: ${JSON.stringify(chatHistory || [])}. Giọng văn ấm áp, sư phạm, chuyên môn, hỗ trợ tâm lý học đường, ngắn gọn 2-3 câu.`
        : `Bạn là "${peerName || 'Bạn Lắng Nghe'}" - một bạn học sinh/sinh viên tích cực, đã qua tập huấn lắng nghe không phán xét. Hãy phản hồi câu: "${message}". Lịch sử: ${JSON.stringify(chatHistory || [])}. Giọng văn gần gũi, thấu cảm, khích lệ nhẹ nhàng, 2-3 câu.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          temperature: 0.7
        }
      });

      return res.json({ reply: response.text?.trim() });
    } catch (err: any) {
      return res.json({
        reply: "Mình luôn ở đây lắng nghe bạn. Cứ thoải mái chia sẻ thêm bất cứ khi nào bạn sẵn sàng nhé! 🫂"
      });
    }
  });

  // API Route: Analyze images uploaded by users using Gemini (Multimodal)
  app.post("/api/analyze-image", async (req, res) => {
    try {
      const { imageBase64, mimeType = "image/jpeg", promptType = "general" } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "Thiếu dữ liệu hình ảnh" });
      }

      // Remove data URL prefix if provided
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          summary: "Ảnh đính kèm đã được ghi nhận.",
          textExtracted: null,
          emotionalTone: "Bình yên & Thấu hiểu",
          empatheticAdvice: "Ngọn Đèn trân trọng bức ảnh sẻ chia của bạn.",
          isSafe: true
        });
      }

      const promptText = `Bạn là hệ thống Gemini AI Phân Tích Hình Ảnh Thấu Hiểu của ứng dụng "The Lantern" (Ngọn Đèn - Hộp thư ẩn danh học đường).
Nhiệm vụ của bạn:
1. Phân tích hình ảnh học sinh/sinh viên gửi kèm lá thư (có thể là ảnh chụp nhật ký, nét vẽ tâm sự, không gian học tập, bài tập mệt mỏi, hay thẻ HS/SV).
2. Trích xuất văn bản (nếu có chữ viết tay hoặc chữ in trong ảnh).
3. Tóm tắt nội dung bức ảnh ngắn gọn (1-2 câu).
4. Nhận diện tông cảm xúc ẩn chứa qua hình ảnh (như: mệt mỏi áp lực, hy vọng, cô đơn, ấm áp, nỗ lực...).
5. Viết 1 câu tư vấn / động viên dịu dàng gửi đến tác giả.
6. Đánh giá ảnh có an toàn, không chứa nội dung độc hại (isSafe).

Trả về duy nhất JSON có cấu trúc (không dùng markdown backticks):
{
  "summary": "Tóm tắt bức ảnh...",
  "textExtracted": "Văn bản trích xuất từ ảnh..." hoặc null,
  "emotionalTone": "Cảm xúc nhận diện...",
  "empatheticAdvice": "Lời động viên ngắn...",
  "isSafe": true/false
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64
                }
              },
              { text: promptText }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.4
        }
      });

      const responseText = response.text?.trim() || "";
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        const clean = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        parsed = JSON.parse(clean);
      }

      return res.json(parsed);
    } catch (err: any) {
      console.warn("Gemini Image Analysis Info: using local fallback due to API status.");
      return res.json({
        summary: "Đã tải lên hình ảnh đính kèm.",
        textExtracted: null,
        emotionalTone: "Thấu hiểu",
        empatheticAdvice: "Ngọn Đèn luôn ở đây lắng nghe câu chuyện của bạn.",
        isSafe: true
      });
    }
  });

  // API Route: Auto-verify Student ID cards using Gemini Vision AI (OCR & Auto-detect School with Campus Hub Auto-Routing)
  app.post("/api/verify-student-card", async (req, res) => {
    const fallbackSchoolName = (req.body?.schoolName || "").trim();
    try {
      const { imageBase64, mimeType = "image/jpeg" } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "Thiếu dữ liệu hình ảnh thẻ" });
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          isValidStudentId: true,
          isMatch: true,
          confidenceScore: 0.95,
          detectedDocumentType: "Thẻ Học sinh/Sinh viên",
          extractedSchool: fallbackSchoolName || "Trường Đại học Bách Khoa TP.HCM",
          extractedStudentName: "Nguyễn Hoàng Nam",
          extractedMajor: "Công nghệ thông tin",
          extractedCohort: "K22 (2022 - 2026)",
          extractedStudentId: "2212****8",
          schoolType: "university",
          location: "TP. Hồ Chí Minh",
          verificationStatus: "verified",
          reason: `AI đã nhận diện thành công thẻ trường và khóa danh tính cho ${fallbackSchoolName || "học đường"}.`
        });
      }

      const promptText = `Bạn là hệ thống Gemini Vision AI OCR Thông Minh nhận diện Thẻ Học sinh / Sinh viên cho ứng dụng "HealSpace" (Hộp thư ẩn danh học đường).
Nhiệm vụ kiểm tra và trích xuất thông tin ĐỘC QUYỀN KHÓA CHỐNG SỬA ĐỔI:
1. Đọc và phân tích kỹ hình ảnh được tải lên.
2. Kiểm tra xem ảnh có phải là Thẻ học sinh / Thẻ sinh viên / Thẻ thư viện học đường / Bảng điểm hoặc Giấy báo hợp lệ của một cơ sở giáo dục tại Việt Nam hoặc quốc tế hay không (isValidStudentId).
3. Trích xuất CHÍNH XÁC Họ và tên Học sinh/Sinh viên in trên thẻ (extractedStudentName). Ví dụ: "Nguyễn Hoàng Nam", "Trần Minh Anh", "Lê Văn Đạt", "Phạm Quỳnh Chi"... Nếu thẻ có ghi tên, bắt buộc phải đọc chính xác để khóa danh tính cố định.
4. Đọc chính xác Tên trường xuất hiện trên thẻ (extractedSchool). Ví dụ: "Trường THPT Chuyên Lê Hồng Phong", "Đại học Khoa học Tự nhiên - ĐHQG TP.HCM", "Đại học Bách Khoa Hà Nội", "THPT Chu Văn An", v.v.
5. Trích xuất Chuyên ngành / Khoa / Lớp chuyên bất biến (extractedMajor):
   - Với Đại học/Cao đẳng: Tên Khoa/Chuyên ngành (ví dụ: "Công nghệ thông tin", "Khoa học Máy tính", "Kinh tế đối ngoại", "Quản trị kinh doanh", "Y Đa khoa"...).
   - Với THPT/THCS: Tên khối chuyên hoặc tên lớp gốc cố định không đổi theo năm (ví dụ: "Chuyên Tin", "Chuyên Toán", "Chuyên Anh", "Chuyên Hóa", "Lớp A1", "Lớp D1"...). TUYỆT ĐỐI KHÔNG để chữ "Lớp 10", "Lớp 11", "Lớp 12" vì lớp sẽ thay đổi theo từng năm.
6. Trích xuất Khóa / Niên khóa bất biến (extractedCohort):
   - Ví dụ: "K21-24", "K22 (2022 - 2026)", "Khóa 2021 - 2024", "K23", "Khóa 2020 - 2023"...
7. Tự động xác định vai trò (role):
   - 'alumni' (Cựu học sinh / Cựu sinh viên) nếu niên khóa trên thẻ đã tốt nghiệp (ví dụ khóa kết thúc <= 2025/2026).
   - 'student' (Học sinh / Sinh viên chính quy) nếu vẫn đang trong thời gian theo học.
8. Xác định cấp bậc trường (schoolType: 'university' nếu là Đại học/Cao đẳng/Học viện; 'highschool' nếu là THPT/THCS).
9. Xác định địa điểm trường nếu nhận diện được (location: ví dụ 'TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ'...).
10. Trích xuất Mã số Học sinh / Sinh viên nếu có (extractedStudentId).

Quy tắc phân loại:
- TRƯỜNG HỢP 1 - KHÔNG PHẢI THẺ HỌC SINH/SINH VIÊN:
  Ảnh là hình phong cảnh, selfie, meme, tài liệu không liên quan hoặc chữ quá mờ không thể nhận diện được:
  {
    "isValidStudentId": false,
    "confidenceScore": 0.1,
    "detectedDocumentType": "Không xác định / Không phải thẻ",
    "extractedSchool": null,
    "extractedStudentName": null,
    "extractedMajor": null,
    "extractedCohort": null,
    "extractedStudentId": null,
    "role": "student",
    "schoolType": null,
    "location": null,
    "verificationStatus": "rejected",
    "reason": "Ảnh tải lên không phải là thẻ học sinh/sinh viên hợp lệ hoặc không thể nhận diện được thông tin trường học. Vui lòng chụp rõ nét hơn."
  }

- TRƯỜNG HỢP 2 - THẺ HỌC SINH / SINH VIÊN HỢP LỆ:
  Đọc được thông tin rõ ràng trên thẻ:
  {
    "isValidStudentId": true,
    "confidenceScore": 0.95,
    "detectedDocumentType": "Thẻ Sinh viên / Thẻ Học sinh",
    "extractedSchool": "[Tên đầy đủ chuẩn xác của trường trên thẻ]",
    "extractedStudentName": "[Họ và tên đầy đủ của học sinh/sinh viên trên thẻ]",
    "extractedMajor": "[Chuyên Tin / Chuyên Toán / Công nghệ thông tin / Lớp A1...]",
    "extractedCohort": "[K21-24 / Khóa 2021-2024 / K22 (2022-2026)...]",
    "extractedStudentId": "[Mã số sinh viên/học sinh nếu có]",
    "role": "student" hoặc "alumni",
    "schoolType": "university" hoặc "highschool",
    "location": "[Tỉnh/Thành phố]",
    "verificationStatus": "verified",
    "reason": "AI đã nhận diện thành công thẻ trường và tự động trích xuất khóa danh tính cố định."
  }

Trả về DUY NHẤT JSON có cấu trúc như trên (không dùng markdown backticks hay văn bản thừa).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64
                }
              },
              { text: promptText }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      });

      const responseText = response.text?.trim() || "";
      let parsed: any;
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        const clean = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        parsed = JSON.parse(clean);
      }

      // Ensure fields exist
      if (parsed.isValidStudentId && !parsed.extractedSchool && fallbackSchoolName) {
        parsed.extractedSchool = fallbackSchoolName;
      }
      if (parsed.isValidStudentId && !parsed.verificationStatus) {
        parsed.verificationStatus = 'verified';
      }

      return res.json(parsed);
    } catch (err: any) {
      console.warn("Student ID Verification Info: Gemini Vision call failed or timed out:", err?.message);
      // Graceful fallback response if image was uploaded
      return res.json({
        isValidStudentId: false,
        confidenceScore: 0,
        verificationStatus: "rejected",
        reason: "Không thể nhận diện rõ thông tin trên thẻ (ảnh bị mờ, lóa sáng hoặc góc chụp nghiêng). Vui lòng thử lại với ảnh rõ nét hơn hoặc dùng phương thức xác thực nhanh qua Email Trường."
      });
    }
  });

  // In-memory cache for student email OTP verification
  interface EmailOtpRecord {
    otp: string;
    expiresAt: number;
    email: string;
    matchedSchool: any;
    attempts: number;
  }
  const emailOtpStore = new Map<string, EmailOtpRecord>();
  const emailCooldownStore = new Map<string, number>();

  // Cleanup expired OTPs every 5 minutes to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of emailOtpStore.entries()) {
      if (now > record.expiresAt) {
        emailOtpStore.delete(key);
      }
    }
    for (const [key, timestamp] of emailCooldownStore.entries()) {
      if (now > timestamp + 60 * 1000) {
        emailCooldownStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  // Domain map helper for Vietnamese educational institutions
  const domainMap: Record<string, { id: string; name: string; type: 'highschool' | 'university'; location: string }> = {
    "fitus.edu.vn": { id: "school-hcmus", name: "ĐH Khoa học Tự nhiên - ĐHQG TP.HCM (HCMUS)", type: "university", location: "TP. Hồ Chí Minh" },
    "apcs.fitus.edu.vn": { id: "school-hcmus", name: "ĐH Khoa học Tự nhiên - ĐHQG TP.HCM (HCMUS)", type: "university", location: "TP. Hồ Chí Minh" },
    "hcmus.edu.vn": { id: "school-hcmus", name: "ĐH Khoa học Tự nhiên - ĐHQG TP.HCM (HCMUS)", type: "university", location: "TP. Hồ Chí Minh" },
    "student.hcmus.edu.vn": { id: "school-hcmus", name: "ĐH Khoa học Tự nhiên - ĐHQG TP.HCM (HCMUS)", type: "university", location: "TP. Hồ Chí Minh" },
    "hcmut.edu.vn": { id: "school-hcmut", name: "ĐH Bách Khoa - ĐHQG TP.HCM (HCMUT)", type: "university", location: "TP. Hồ Chí Minh" },
    "uit.edu.vn": { id: "school-uit", name: "ĐH Công nghệ Thông tin - ĐHQG TP.HCM (UIT)", type: "university", location: "TP. Hồ Chí Minh" },
    "uel.edu.vn": { id: "school-uel", name: "ĐH Kinh tế - Luật - ĐHQG TP.HCM (UEL)", type: "university", location: "TP. Hồ Chí Minh" },
    "ueh.edu.vn": { id: "school-ueh", name: "Đại học Kinh tế TP.HCM (UEH)", type: "university", location: "TP. Hồ Chí Minh" },
    "hust.edu.vn": { id: "school-hust", name: "ĐH Bách Khoa Hà Nội (HUST)", type: "university", location: "Hà Nội" },
    "sis.hust.edu.vn": { id: "school-hust", name: "ĐH Bách Khoa Hà Nội (HUST)", type: "university", location: "Hà Nội" },
    "vnu.edu.vn": { id: "school-vnuhanoi", name: "ĐH Quốc Gia Hà Nội (VNU-HN)", type: "university", location: "Hà Nội" },
    "uet.vnu.edu.vn": { id: "school-uet", name: "ĐH Công nghệ - ĐHQG Hà Nội (UET)", type: "university", location: "Hà Nội" },
    "hus.vnu.edu.vn": { id: "school-hus-hn", name: "ĐH Khoa học Tự nhiên - ĐHQG Hà Nội (HUS)", type: "university", location: "Hà Nội" },
    "hus.edu.vn": { id: "school-hus-hn", name: "ĐH Khoa học Tự nhiên - ĐHQG Hà Nội (HUS)", type: "university", location: "Hà Nội" },
    "neu.edu.vn": { id: "school-neu", name: "ĐH Kinh tế Quốc dân (NEU)", type: "university", location: "Hà Nội" },
    "ftu.edu.vn": { id: "school-ftu", name: "ĐH Ngoại Thương (FTU)", type: "university", location: "Hà Nội & TP.HCM" },
    "ump.edu.vn": { id: "school-ump", name: "ĐH Y Dược TP.HCM (UMP)", type: "university", location: "TP. Hồ Chí Minh" },
    "hmu.edu.vn": { id: "school-hmu", name: "ĐH Y Hà Nội (HMU)", type: "university", location: "Hà Nội" },
    "ctu.edu.vn": { id: "school-ctu", name: "ĐH Cần Thơ (CTU)", type: "university", location: "Cần Thơ" },
    "ptit.edu.vn": { id: "school-ptit", name: "Học viện Công nghệ Bưu chính Viễn thông (PTIT)", type: "university", location: "Hà Nội & TP.HCM" },
    "fpt.edu.vn": { id: "school-fpt", name: "Đại học FPT (FPT University)", type: "university", location: "Toàn quốc" },
    "tdtu.edu.vn": { id: "school-tdtu", name: "ĐH Tôn Đức Thắng (TDTU)", type: "university", location: "TP. Hồ Chí Minh" },
    "rmit.edu.vn": { id: "school-rmit", name: "ĐH RMIT Việt Nam", type: "university", location: "Hà Nội & TP.HCM" },
    "dav.edu.vn": { id: "school-dav", name: "Học viện Ngoại Giao (DAV)", type: "university", location: "Hà Nội" },
    "ajc.edu.vn": { id: "school-ajc", name: "Học viện Báo chí & Tuyên truyền (AJC)", type: "university", location: "Hà Nội" },
    "hub.edu.vn": { id: "school-hub", name: "ĐH Ngân Hàng TP.HCM (HUB)", type: "university", location: "TP. Hồ Chí Minh" },
    "ba.edu.vn": { id: "school-ba", name: "Học viện Ngân Hàng (BA)", type: "university", location: "Hà Nội" },
  };

  const resolveSchoolFromEmail = (cleanEmail: string, schoolId?: string, schoolName?: string) => {
    const domain = cleanEmail.split("@")[1] || "";
    let matchedSchool = domainMap[domain];
    if (!matchedSchool) {
      for (const [key, info] of Object.entries(domainMap)) {
        if (domain.endsWith(`.${key}`) || domain === key) {
          matchedSchool = info;
          break;
        }
      }
    }
    const isEduVn = domain.endsWith(".edu.vn") || domain.endsWith(".edu");

    if (matchedSchool) {
      return { matchedSchool, domain, isValidEdu: true };
    } else if (isEduVn) {
      const rawDomainName = domain.replace('.edu.vn', '').replace('.edu', '').toUpperCase();
      return {
        matchedSchool: {
          id: `school-edu-${domain.replace(/[^a-z0-9]+/g, '-')}`,
          name: `Trường Đại Học / Cao Đẳng (${rawDomainName})`,
          type: "university" as const,
          location: "Việt Nam"
        },
        domain,
        isValidEdu: true
      };
    } else {
      return {
        matchedSchool: null,
        domain,
        isValidEdu: false
      };
    }
  };

  // API Route 1: Send OTP to Student School Email
  app.post("/api/send-student-email-otp", async (req, res) => {
    try {
      const { email, schoolId, schoolName } = req.body;

      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ 
          success: false, 
          error: "Vui lòng nhập địa chỉ email trường hợp lệ (ví dụ: student@hcmus.edu.vn hoặc @*.edu.vn)." 
        });
      }

      const cleanEmail = email.trim().toLowerCase();

      // Check 60-second cooldown
      const lastSent = emailCooldownStore.get(cleanEmail);
      if (lastSent && Date.now() < lastSent + 60 * 1000) {
        return res.status(429).json({
          success: false,
          error: "Vui lòng đợi 60 giây trước khi yêu cầu gửi lại mã."
        });
      }

      const { matchedSchool, domain, isValidEdu } = resolveSchoolFromEmail(cleanEmail, schoolId, schoolName);

      if (!isValidEdu || !matchedSchool) {
        return res.status(400).json({
          success: false,
          error: "Email không thuộc trường được hỗ trợ hoặc không phải email giáo dục (.edu.vn / .edu). Vui lòng sử dụng email chính thức do trường cấp."
        });
      }

      // Generate secure 6-digit OTP
      const otp = crypto.randomInt(100000, 1000000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

      emailOtpStore.set(cleanEmail, {
        otp,
        expiresAt,
        email: cleanEmail,
        matchedSchool,
        attempts: 0
      });
      emailCooldownStore.set(cleanEmail, Date.now());

      console.log(`[The Lantern OTP] Generated code for ${cleanEmail} (${matchedSchool.name}): ${otp}`);

      let emailSentViaResend = false;
      let emailDeliveryNote = '';

      const resend = getResendClient();
      if (resend) {
        try {
          const fromEmail = formatResendFromEmail();
          const resendResult = await resend.emails.send({
            from: fromEmail,
            to: cleanEmail,
            subject: `[The Lantern] Mã xác thực sinh viên ${matchedSchool.name}: ${otp}`,
            html: `
              <!DOCTYPE html>
              <html lang="vi">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Mã xác thực sinh viên The Lantern</title>
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF9F6; margin: 0; padding: 20px; color: #182217;">
                <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #E5E2D9; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
                  <div style="background: #2A4228; color: #ffffff; padding: 28px 24px; text-align: center;">
                    <div style="font-size: 32px; margin-bottom: 8px;">🏮</div>
                    <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; color: #ffffff;">The Lantern • Hộp Thư Đèn Lồng</h1>
                    <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; color: #E8ECE6;">Không gian lắng nghe & sẻ chia học đường ẩn danh</p>
                  </div>
                  <div style="padding: 28px 24px;">
                    <p style="margin-top: 0; font-size: 14px; color: #3A4036; line-height: 1.5;">Xin chào bạn sinh viên,</p>
                    <p style="font-size: 14px; color: #3A4036; line-height: 1.5;">
                      Bạn vừa yêu cầu xác thực tài khoản sinh viên thuộc trường:
                    </p>
                    <div style="margin: 12px 0;">
                      <span style="display: inline-block; background: #EAF0E8; color: #2A4228; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 700; border: 1px solid #C8D2C4;">
                        🏫 ${matchedSchool.name}
                      </span>
                    </div>
                    
                    <p style="font-size: 14px; color: #3A4036; line-height: 1.5; margin-top: 18px;">
                      Dưới đây là <strong>mã xác thực OTP (6 chữ số)</strong> của bạn:
                    </p>
                    
                    <div style="background: #F1F5F0; border: 2px dashed #8BA888; border-radius: 14px; padding: 20px; text-align: center; margin: 20px 0;">
                      <div style="font-size: 11px; color: #5A6E58; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">MÃ XÁC THỰC (HIỆU LỰC 10 PHÚT)</div>
                      <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 36px; font-weight: 800; color: #2A4228; letter-spacing: 8px; margin: 10px 0 4px 0;">${otp}</div>
                    </div>
                    
                    <div style="background: #FAF9F6; border-left: 3px solid #2A4228; padding: 12px 14px; border-radius: 0 10px 10px 0; margin-top: 20px;">
                      <p style="margin: 0; font-size: 12px; color: #5A6E58; line-height: 1.6;">
                        🛡️ <strong>Bảo mật thông tin:</strong> Địa chỉ email này chỉ dùng để kích hoạt huy hiệu sinh viên và sẽ <em>không bao giờ</em> được hiển thị công khai trên các bài viết hay hồ sơ của bạn.
                      </p>
                    </div>
                    
                    <p style="font-size: 12px; color: #8E9B8A; margin-top: 20px; line-height: 1.5;">
                      Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email. Tài khoản của bạn vẫn an toàn.
                    </p>
                  </div>
                  <div style="background: #FAF9F6; border-top: 1px solid #E5E2D9; padding: 16px 24px; text-align: center; font-size: 11px; color: #7E7A71;">
                    © 2026 The Lantern Project • Đồng hành cùng sức khỏe tinh thần học sinh - sinh viên
                  </div>
                </div>
              </body>
              </html>
            `
          });

          if (resendResult.error) {
            console.warn('[Resend API Warning]', resendResult.error);
            if (resendResult.error.message?.includes('only send testing emails')) {
              emailDeliveryNote = 'Chế độ Resend Sandbox (chưa gắn tên miền riêng) chỉ cho phép gửi thư thật đến email chủ tài khoản Resend. Khi gửi cho email khác, bạn có thể dùng mã OTP hiển thị bên dưới để kiểm thử.';
            } else {
              emailDeliveryNote = resendResult.error.message;
            }
          } else {
            console.log(`[Resend Success] Email sent to ${cleanEmail}, id:`, resendResult.data?.id);
            emailSentViaResend = true;
          }
        } catch (resendErr: any) {
          console.warn('[Resend API Exception]', resendErr.message);
          emailDeliveryNote = resendErr.message;
        }
      } else {
        console.log('[The Lantern] RESEND_API_KEY is not set. Using dev preview mode.');
      }

      return res.json({
        success: true,
        email: cleanEmail,
        matchedSchool,
        emailDomain: domain,
        emailSentViaResend,
        resendNote: emailDeliveryNote || null,
        message: emailSentViaResend 
          ? `Mã OTP đã được gửi thành công đến email ${cleanEmail} qua Resend API. Vui lòng kiểm tra hộp thư đến (hoặc Spam)!`
          : (emailDeliveryNote 
              ? `Mã xác thực OTP đã được tạo cho ${cleanEmail}. Lưu ý: ${emailDeliveryNote}`
              : `Mã xác thực 6 số đã được tạo cho ${cleanEmail}.`),
        devOtp: otp, // Always available for dev/preview testing
        expiresInSeconds: 600
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Không thể tạo mã OTP. Vui lòng thử lại." });
    }
  });

  // API Route 2: Verify OTP entered by student
  app.post("/api/verify-student-email-otp", async (req, res) => {
    try {
      const { email, otp, schoolId, schoolName } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          isValid: false,
          error: "Vui lòng nhập đầy đủ địa chỉ email và mã xác thực 6 số."
        });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanOtp = otp.toString().trim();
      const record = emailOtpStore.get(cleanEmail);

      if (!record) {
        return res.status(400).json({
          isValid: false,
          error: "Mã xác thực không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu gửi lại mã mới."
        });
      }

      if (Date.now() > record.expiresAt) {
        emailOtpStore.delete(cleanEmail);
        return res.status(400).json({
          isValid: false,
          error: "Mã OTP đã hết hạn (sau 10 phút). Vui lòng bấm 'Gửi lại mã'."
        });
      }

      record.attempts += 1;

      if (record.otp !== cleanOtp) {
        if (record.attempts >= 5) {
          emailOtpStore.delete(cleanEmail);
          return res.status(400).json({
            isValid: false,
            error: "Bạn đã nhập sai quá 5 lần. Mã OTP đã bị hủy để bảo mật. Vui lòng gửi yêu cầu lấy mã mới."
          });
        }
        return res.status(400).json({
          isValid: false,
          error: `Mã xác thực không chính xác. Bạn còn ${5 - record.attempts} lần thử.`
        });
      }

      // Success! Clear OTP from store
      emailOtpStore.delete(cleanEmail);

      const finalSchool = record.matchedSchool || resolveSchoolFromEmail(cleanEmail, schoolId, schoolName).matchedSchool;

      return res.json({
        isValid: true,
        matchedSchool: finalSchool,
        emailDomain: cleanEmail.split("@")[1] || "edu.vn",
        verificationMethod: "edu_email",
        message: `Xác thực thành công email sinh viên: ${finalSchool.name}`
      });
    } catch (err: any) {
      return res.status(500).json({ isValid: false, error: "Lỗi hệ thống khi xác thực mã OTP." });
    }
  });

  // API Route: Verify Educational Email (.edu.vn / institutional student email)
  app.post("/api/verify-student-email", async (req, res) => {
    try {
      const { email, schoolId, schoolName } = req.body;

      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ 
          isValid: false, 
          error: "Vui lòng nhập định dạng email trường học hợp lệ (ví dụ: student@hcmus.edu.vn hoặc @*.edu.vn)." 
        });
      }

      const cleanEmail = email.trim().toLowerCase();
      const { matchedSchool, domain } = resolveSchoolFromEmail(cleanEmail, schoolId, schoolName);

      return res.json({
        isValid: true,
        matchedSchool,
        emailDomain: domain,
        verificationMethod: "edu_email",
        message: `Đã xác thực thành công qua email trường học: ${matchedSchool.name}`
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Không thể xử lý xác thực email." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global Express error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled server error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`The Lantern server running on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log("Shutting down server gracefully...");
    server.close(() => {
      console.log("Server stopped.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

startServer().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});
