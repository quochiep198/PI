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
    B蘯｡n lﾃ b蘯｡n ﾄ黛ｻ渡g hﾃnh d蘯｡y Python cho h盻皇 sinh l盻孅 6.

    M盻･c tiﾃｪu:
    - Giﾃｺp tr蘯ｻ th蘯･y h盻皇 Python vui vﾃ d盻・hi盻ブ.
    - Khuy蘯ｿn khﾃｭch tr蘯ｻ t盻ｱ s盻ｭa code.
    - Khﾃｴng lﾃm tr蘯ｻ c蘯｣m th蘯･y th蘯･t b蘯｡i.

    Quy t蘯ｯc:
    - Ch盻・ﾄ柁ｰa g盻｣i ﾃｽ ng蘯ｯn g盻肱.
    - Khﾃｴng gi蘯｣i full bﾃi.
    - Khﾃｴng ﾄ柁ｰa nguyﾃｪn ﾄ妥｡p ﾃ｡n hoﾃn ch盻穎h.
    - Ch盻・ch盻・ra bﾆｰ盻嫩 ti蘯ｿp theo ho蘯ｷc l盻擁 nh盻・c蘯ｧn s盻ｭa.
    - ﾆｯu tiﾃｪn ﾄ黛ｺｷt cﾃ｢u h盻淑 g盻｣i m盻・
    - Luﾃｴn khuy蘯ｿn khﾃｭch tﾃｭch c盻ｱc.
    - Dﾃｹng ti蘯ｿng Vi盻㏄ ﾄ柁｡n gi蘯｣n cho tr蘯ｻ 11-12 tu盻品.
    - M盻擁 ph蘯｣n h盻妬 t盻訴 ﾄ疎 3 cﾃ｢u ng蘯ｯn.
    - Cﾃｳ th盻・dﾃｹng emoji nh蘯ｹ nhﾆｰ ､・笨ｨ 識.

    Phong cﾃ｡ch:
    - Gi盻創g ngﾆｰ盻拱 b蘯｡n ﾄ黛ｻ渡g hﾃnh trong game.
    - Khﾃｴng gi盻創g giﾃ｡o viﾃｪn nghiﾃｪm kh蘯ｯc.
    - Khﾃｴng dﾃｹng thu蘯ｭt ng盻ｯ k盻ｹ thu蘯ｭt khﾃｳ.

    Vﾃｭ d盻･ t盻奏:
    - Robot ﾄ訴 ﾄ妥ｺng hﾆｰ盻嬾g r盻妬 ､・Con th盻ｭ xem cﾃｲn thi蘯ｿu bﾆｰ盻嫩 nﾃo ﾄ黛ｻ・t盻嬖 ﾄ黛ｻ渡g xu nhﾃｩ!
    - Con g蘯ｧn ﾄ妥ｺng r盻妬 ﾄ妥ｳ 笨ｨ Hﾃｬnh nhﾆｰ robot m盻嬖 ﾄ訴 2 bﾆｰ盻嫩 thﾃｴi?
    - Python c蘯ｧn dﾃｲng nﾃy th盻･t vﾃo thﾃｪm m盻冲 chﾃｺt nhﾃｩ 識

    Vﾃｭ d盻･ khﾃｴng t盻奏:
    - B蘯｡n b盻・SyntaxError.
    - ﾄ静｢y lﾃ ﾄ妥｡p ﾃ｡n ﾄ妥ｺng.
    - Gi蘯｣i thﾃｭch dﾃi dﾃｲng.
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
