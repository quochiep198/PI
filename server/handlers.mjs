import { query } from './db.mjs';

const groqApiKey = process.env.GROQ_API_KEY;
const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

function getRequestBody(request) {
  return request.body ?? {};
}

function getLearnerKey(request) {
  if (request.params?.learnerKey) {
    return request.params.learnerKey;
  }

  const learnerKey = request.query?.learnerKey;
  return Array.isArray(learnerKey) ? learnerKey[0] : learnerKey;
}

export async function healthHandler(_request, response) {
  try {
    await query('SELECT 1');
    response.json({ ok: true });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'Database connection failed.',
    });
  }
}

export async function lessonsHandler(_request, response) {
  try {
    const lessons = await query(`
      SELECT
        id,
        slug,
        track,
        lesson_order AS "lessonOrder",
        chapter,
        title,
        description,
        objective,
        starter_code AS "starterCode",
        completion_check_type AS "completionCheckType",
        completion_check_value AS "completionCheckValue"
      FROM lessons
      ORDER BY lesson_order ASC
    `);

    response.json(lessons);
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to load lessons.',
    });
  }
}

export async function progressHandler(request, response) {
  try {
    const learnerKey = getLearnerKey(request);
    const progress = await query(
      `
        SELECT lesson_id AS "lessonId"
        FROM lesson_progress
        WHERE learner_key = $1
      `,
      [learnerKey],
    );

    response.json(progress);
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to load lesson progress.',
    });
  }
}

export async function completeProgressHandler(request, response) {
  const { learnerKey, lessonId } = getRequestBody(request);

  if (!learnerKey || !lessonId) {
    response.status(400).json({
      message: 'Missing learnerKey or lessonId.',
    });
    return;
  }

  try {
    await query(
      `
        INSERT INTO lesson_progress (learner_key, lesson_id)
        VALUES ($1, $2)
        ON CONFLICT (learner_key, lesson_id)
        DO UPDATE SET completed_at = CURRENT_TIMESTAMP
      `,
      [learnerKey, lessonId],
    );

    response.status(201).json({ ok: true });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to save lesson progress.',
    });
  }
}

export async function hintHandler(request, response) {
  const { lessonTitle, objective, code, starterCode } = getRequestBody(request);

  if (!groqApiKey) {
    response.status(500).json({
      message: 'GROQ_API_KEY is not configured on the server.',
    });
    return;
  }

  if (!lessonTitle || !objective || !code) {
    response.status(400).json({
      message: 'Missing lessonTitle, objective, or code.',
    });
    return;
  }

  try {
    const systemPrompt = `
Bạn là bạn đồng hành dạy Python cho học sinh lớp 6.

Mục tiêu:
- Giúp trẻ thấy học Python vui và dễ hiểu.
- Khuyến khích trẻ tự sửa code.
- Không làm trẻ cảm thấy thất bại.

Quy tắc:
- Chỉ đưa gợi ý ngắn gọn.
- Không giải full bài.
- Không đưa nguyên đáp án hoàn chỉnh.
- Chỉ chỉ ra bước tiếp theo hoặc lỗi nhỏ cần sửa.
- Ưu tiên đặt câu hỏi gợi mở.
- Luôn khuyến khích tích cực.
- Dùng tiếng Việt đơn giản cho trẻ 11-12 tuổi.
- Mỗi phản hồi tối đa 3 câu ngắn.
- Có thể dùng emoji nhẹ như 🤖 ✨ 🎯.

Phong cách:
- Giống người bạn đồng hành trong game.
- Không giống giáo viên nghiêm khắc.
- Không dùng thuật ngữ kỹ thuật khó.

Ví dụ tốt:
- Robot đi đúng hướng rồi 🤖 Con thử xem còn thiếu bước nào để tới đồng xu nhé!
- Con gần đúng rồi đó ✨ Hình như robot mới đi 2 bước thôi?
- Python cần dòng này thụt vào thêm một chút nhé 🎯

Ví dụ không tốt:
- Bạn bị SyntaxError.
- Đây là đáp án đúng.
- Giải thích dài dòng.
`.trim();
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: groqModel,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              `Bﾃi h盻皇: ${lessonTitle}`,
              `M盻･c tiﾃｪu: ${objective}`,
              starterCode ? `Starter code:\n${starterCode}` : '',
              `Code hi盻㌻ t蘯｡i c盻ｧa h盻皇 sinh:\n${code}`,
              'Hﾃ｣y ﾄ柁ｰa ra 1-3 g盻｣i ﾃｽ ng蘯ｯn, d盻・hi盻ブ, khuy蘯ｿn khﾃｭch t盻ｱ s盻ｭa.',
            ]
              .filter(Boolean)
              .join('\n\n'),
          },
        ],
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      throw new Error(errorText || 'Groq request failed.');
    }

    const payload = await groqResponse.json();
    const hint = payload?.choices?.[0]?.message?.content?.trim();

    response.json({
      hint: hint || 'Chﾆｰa nh蘯ｭn ﾄ柁ｰ盻｣c g盻｣i ﾃｽ t盻ｫ Groq.',
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to generate hint.',
    });
  }
}

export async function createLessonHandler(request, response) {
  const {
    slug,
    track,
    lessonOrder,
    chapter,
    title,
    description,
    objective,
    starterCode,
    completionCheckType,
    completionCheckValue,
  } = getRequestBody(request);

  if (
    !slug ||
    !track ||
    !lessonOrder ||
    !chapter ||
    !title ||
    !description ||
    !objective ||
    !starterCode ||
    !completionCheckType ||
    !completionCheckValue
  ) {
    response.status(400).json({
      message: 'Missing required lesson fields.',
    });
    return;
  }

  try {
    const result = await query(
      `
        INSERT INTO lessons (
          slug,
          track,
          lesson_order,
          chapter,
          title,
          description,
          objective,
          starter_code,
          completion_check_type,
          completion_check_value
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING
          id,
          slug,
          track,
          lesson_order AS "lessonOrder",
          chapter,
          title,
          description,
          objective,
          starter_code AS "starterCode",
          completion_check_type AS "completionCheckType",
          completion_check_value AS "completionCheckValue"
      `,
      [
        slug,
        track,
        lessonOrder,
        chapter,
        title,
        description,
        objective,
        starterCode,
        completionCheckType,
        completionCheckValue,
      ],
    );

    response.status(201).json(result[0]);
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to create lesson.',
    });
  }
}
