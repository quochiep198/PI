import { promisify } from 'node:util';
import { put } from '@vercel/blob';
import { execute, query } from '../db.mjs';
import { getAndUpdateActivePet } from './pets.mjs';

import {
  getLevelFromXp,
  getRequestBody,
  isProduction,
  normalizeIdentifier,
  serializeCookie,
  clearCookie,
  parseCookies,
  sendSseEvent,
  pruneExpiredPresenceLeases,
  touchPresenceLease,
  deletePresenceLease,
  getOnlineLearnerCount,
  sendPresenceUpdate,
  canAccessTrack,
  safeJsonParse,
  extractMistakeTags,
  normalizeMultilineText,
  normalizeHintCode,
  getClientIp,
  getHintEntitlement,
  getUtcDayBounds,
  getUtcDateString,
  addUtcDays,
  getUtcWeekBounds,
  buildWeekDaysFromCheckins,
  getHintIpRateLimitStatus,
  recordHintRequest,
  getHintCooldownStatus,
  markHintCooldownUsed,
  buildHintCacheKey,
  getDailyHintUsageCount,
  getDailyHintUsageCountByLesson,
  getCachedHint,
  saveCachedHint,
  recordHintUsage,
  getUserXp,
  ensureUserXp,
  hasUserClaimedLessonXp,
  addUserXp,
  ensureUserCoins,
  ensureUserStreak,
  getUserStreakData,
  getStreakAchievement,
  getStreakReward,
  getUserCoins,
  getLeaderboardEntries,
  addUserCoins,
  markFirstSuccessRun,
  hasFirstSuccessRun,
  getLessonById,
  getRecentLessonErrors,
  callGroqChat,
  isRetryableGroqError,
  generateHintWithFallback,
  analyzeLessonError,
  hashSessionToken,
  generateOtp,
  hashOtp,
  hashPassword,
  verifyPassword,
  getPasswordStrengthError,
  checkOtpRequestRateLimit,
  createPasswordResetOtp,
  sendPasswordResetOtpEmail,
  sanitizeUser,
  parseAvatarDataUrl,
  saveAvatarForUser,
  deleteExpiredSessions,
  createSession,
  getAuthenticatedUser,
  requireAuthenticatedUser,
  ensureAppSchema,
  getTodayDateString,
  seededShuffle,
  getDailySeed,
  scryptAsync,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_MS,
  PASSWORD_RESET_GENERIC_MESSAGE,
  OTP_EXPIRY_MS,
  OTP_LENGTH,
  OTP_REQUEST_WINDOW_MS,
  OTP_REQUEST_LIMIT,
  MAX_AVATAR_BYTES,
  groqApiKey,
  groqPrimaryModel,
  groqSmallModel,
  PRO_TRACKS,
  ERROR_HISTORY_LIMIT,
  HINT_CACHE_TTL_MS,
  HINT_IP_WINDOW_MS,
  HINT_IP_LIMIT,
  HINT_DAILY_QUOTA_FREE,
  HINT_DAILY_QUOTA_PRO,
  HINT_LESSON_DAILY_QUOTA_FREE,
  HINT_LESSON_DAILY_QUOTA_PRO,
  HINT_COOLDOWN_FREE_MS,
  HINT_COOLDOWN_PRO_MS,
  HINT_MAX_TOKENS_FREE,
  HINT_MAX_TOKENS_PRO,
  HINT_TEMPERATURE,
  PRESENCE_HEARTBEAT_MS,
  PRESENCE_LEASE_MS,
  XP_LESSON_COMPLETE_FIRST,
  XP_FIRST_SUCCESS_RUN,
  XP_DAILY_CHALLENGE,
  XP_DAILY_CHALLENGE_BONUS,
  COINS_LESSON_COMPLETE,
  COINS_CODE_REVIEW,
  XP_CODE_REVIEW,
  COINS_STREAK_BASE,
  COINS_STREAK_STEP,
  STREAK_ACHIEVEMENTS,
  LEVEL_THRESHOLDS,
  XP_SOURCES,
  GroqRequestError
} from '../utils/core.mjs';

export async function errorFeedbackHandler(request, response) {
  const { lessonId, code, errorOutput } = getRequestBody(request);

  if (!groqApiKey) {
    response.status(500).json({
      message: 'GROQ_API_KEY is not configured on the server.',
    });
    return;
  }

  if (!lessonId || !code || !errorOutput) {
    response.status(400).json({
      message: 'Missing lessonId, code, or errorOutput.',
    });
    return;
  }

  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    const lesson = await getLessonById(lessonId);
    if (!lesson) {
      response.status(404).json({
        message: 'Lesson not found.',
      });
      return;
    }

    if (!canAccessTrack(user, lesson.track)) {
      response.status(403).json({
        message: 'This lesson is only available for Pro accounts.',
      });
      return;
    }

    const errorHistory = await getRecentLessonErrors(user.id, lessonId);
    const analysis = await analyzeLessonError({
      lesson,
      code,
      errorOutput,
      errorHistory,
    });

    await query(
      `
        INSERT INTO user_lesson_errors (
          user_id,
          lesson_id,
          error_message,
          code_snapshot,
          ai_explanation,
          ai_guidance,
          mistake_tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
      `,
      [
        user.id,
        lessonId,
        errorOutput,
        code,
        analysis.explanation,
        analysis.guidance,
        JSON.stringify(analysis.mistakeTags),
      ],
    );

    response.json(analysis);
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to analyze lesson error.',
    });
  }
}

export async function hintHandler(request, response) {
  const { lessonId, lessonTitle, objective, starterCode, code, output, errorOutput } = getRequestBody(request);

  if (!groqApiKey) {
    response.status(500).json({
      message: 'GROQ_API_KEY is not configured on the server.',
    });
    return;
  }

  if (!lessonId || !code) {
    response.status(400).json({
      message: 'Missing lessonId or code.',
    });
    return;
  }

  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    const lesson = await getLessonById(lessonId);
    if (!lesson) {
      response.status(404).json({
        message: 'Lesson not found.',
      });
      return;
    }

    if (!canAccessTrack(user, lesson.track)) {
      response.status(403).json({
        message: 'This lesson is only available for Pro accounts.',
      });
      return;
    }

    const entitlement = getHintEntitlement(user);
    const ipLimitStatus = await getHintIpRateLimitStatus(request);
    if (!ipLimitStatus.allowed) {
      response.setHeader('Retry-After', String(ipLimitStatus.retryAfterSeconds));
      response.status(429).json({
        message: `Bạn đang gửi quá nhiều yêu cầu gợi ý AI từ cùng một mạng. Hãy thử lại sau khoảng ${ipLimitStatus.retryAfterSeconds} giây.`,
      });
      return;
    }

    const dayBounds = getUtcDayBounds();
    const userDailyUsage = await getDailyHintUsageCount(user.id, dayBounds);
    if (userDailyUsage >= entitlement.dailyQuota) {
      response.status(429).json({
        message: `Bạn đã dùng hết ${entitlement.dailyQuota} lượt gợi ý AI hôm nay. Hãy quay lại vào ngày mai hoặc nâng cấp Pro nếu cần thêm quota.`,
      });
      return;
    }

    const lessonDailyUsage = await getDailyHintUsageCountByLesson(user.id, lesson.id, dayBounds);
    if (lessonDailyUsage >= entitlement.lessonDailyQuota) {
      response.status(429).json({
        message: `Bạn đã dùng hết ${entitlement.lessonDailyQuota} lượt gợi ý cho bài học này trong hôm nay. Hãy thử tự chỉnh code trước rồi quay lại sau.`,
      });
      return;
    }

    const cooldownStatus = await getHintCooldownStatus(user.id, entitlement.cooldownMs);
    if (!cooldownStatus.allowed) {
      response.setHeader('Retry-After', String(cooldownStatus.retryAfterSeconds));
      response.status(429).json({
        message: `Hãy chờ thêm ${cooldownStatus.retryAfterSeconds} giây rồi xin gợi ý tiếp nhé.`,
      });
      return;
    }

    const normalizedCode = normalizeHintCode(code);
    const cacheKey = buildHintCacheKey({
      lessonId,
      lessonTitle: lessonTitle || lesson.title,
      objective: objective || lesson.objective,
      starterCode: starterCode || lesson.starterCode,
      code: normalizedCode,
    });
    const cachedHint = await getCachedHint(cacheKey);

    await markHintCooldownUsed(user.id);
    await recordHintRequest({
      userId: user.id,
      lessonId: lesson.id,
      requestIp: ipLimitStatus.ip,
    });

    if (cachedHint?.responseText) {
      response.json({
        hint: cachedHint.responseText,
        cached: true,
        model: cachedHint.model,
      });
      return;
    }

    const errorHistory = await getRecentLessonErrors(user.id, lessonId);
    const mistakeSummary =
      errorHistory.length > 0
        ? errorHistory
            .map((item, index) => {
              const tags = extractMistakeTags(item.mistakeTags).join(', ') || 'không có tag';
              return `${index + 1}. Loi hay gap: ${item.errorMessage}\nGoi y tung dua: ${item.aiGuidance}\nTag: ${tags}`;
            })
            .join('\n\n')
        : 'Chưa có lịch sử lỗi cho bài học này.';

    const systemPrompt = `
Bạn là bạn đồng hành dạy Python cho học sinh lớp 6.

NHIỆM VỤ BẮT BUỘC:
1. Đầu tiên giải thích ngắn gọn ý nghĩa các lệnh Python học sinh đang dùng.
2. Sau đó mới chỉ ra lỗi hoặc điều cần sửa.
3. Cuối cùng đưa 1 gợi ý nhỏ để học sinh tự sửa.

QUY TẮC:
- Không giải full bài.
- Không đưa đáp án hoàn chỉnh.
- Mỗi phản hồi tối đa 5 câu ngắn.
- Dùng tiếng Việt đơn giản cho trẻ 11-12 tuổi.
- Nếu học sinh dùng biến, print(), input(), if, for, while, function, method hoặc list thì phải giải thích nó đang làm gì trước.
- Nếu có lỗi Python thì giải thích lỗi đó bằng ngôn ngữ dễ hiểu.
- Ưu tiên đặt câu hỏi gợi mở.
- Luôn khuyến khích tích cực.

PHONG CÁCH:
- Thân thiện.
- Giống đồng đội trong game.
- Không giống giáo viên nghiêm khắc.
- Không dùng thuật ngữ kỹ thuật khó.

ĐỊNH DẠNG PHẢN HỒI BẮT BUỘC:

1. Giải thích:
<giải thích ngắn gọn ý nghĩa lệnh/hàm đang dùng>

2. Lỗi:
<chỉ ra lỗi hoặc điều cần sửa, nếu có>

3. Gợi ý:
<1 gợi ý nhỏ để học sinh tự làm tiếp>
`.trim();

    const latestRuntimeContext = [
      errorOutput ? `Lỗi Python gần nhất:\n${normalizeMultilineText(errorOutput)}` : '',
      !errorOutput && output ? `Kết quả chạy gần nhất:\n${normalizeMultilineText(output)}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const hintPrompt = [
    `Bài học: ${lesson.title}`,
    `Mục tiêu: ${lesson.objective}`,
    lesson.starterCode ? `Starter code:\n${lesson.starterCode}` : '',
    `Code hiện tại của học sinh:\n${normalizedCode}`,
    latestRuntimeContext,
    `Lỗi học sinh hay gặp trước đây:\n${mistakeSummary}`,
    'Hãy phản hồi đúng định dạng bắt buộc: Giải thích -> Lỗi -> Gợi ý. Ưu tiên giải thích ý nghĩa lệnh Python trước khi đưa gợi ý sửa lỗi.',
  ]
    .filter(Boolean)
    .join('\n\n');

    const hintResult = await generateHintWithFallback({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: hintPrompt,
        },
      ],
      modelOrder: entitlement.modelOrder,
      maxCompletionTokens: entitlement.maxCompletionTokens,
    });

    const hint = hintResult.hint || 'Chưa nhận được gợi ý từ Groq.';

    await saveCachedHint({
      cacheKey,
      lessonId: lesson.id,
      hint,
      model: hintResult.model,
    });

    await recordHintUsage({
      userId: user.id,
      lessonId: lesson.id,
      model: hintResult.model,
      requestIp: ipLimitStatus.ip,
    });

    response.json({
      hint,
      cached: false,
      model: hintResult.model,
    });
  } catch (error) {
    if (error instanceof GroqRequestError && (error.status === 429 || error.status >= 500)) {
      response.status(429).json({
        message: 'Hệ thống gợi ý AI đang bận hoặc tạm chạm giới hạn. Bạn thử lại sau ít phút nhé.',
      });
      return;
    }

    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to generate hint.',
    });
  }
}

export async function codeReviewHandler(request, response) {
  const { lessonId, code } = getRequestBody(request);

  if (!groqApiKey) {
    response.status(500).json({
      message: 'GROQ_API_KEY is not configured on the server.',
    });
    return;
  }

  if (!lessonId || !code) {
    response.status(400).json({
      message: 'Missing lessonId or code.',
    });
    return;
  }

  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    const lesson = await getLessonById(lessonId);
    if (!lesson) {
      response.status(404).json({
        message: 'Lesson not found.',
      });
      return;
    }

    if (!canAccessTrack(user, lesson.track)) {
      response.status(403).json({
        message: 'This lesson is only available for Pro accounts.',
      });
      return;
    }

    const existingReviews = await query(
      `SELECT EXISTS (
         SELECT 1 FROM user_lesson_reviews 
         WHERE user_id = $1 AND lesson_id = $2 AND coins_earned > 0
       ) AS "alreadyRewarded"`,
      [user.id, lesson.id]
    );
    const alreadyRewarded = existingReviews[0]?.alreadyRewarded || false;

    const systemPrompt = `
Bạn là Mascot AI đáng yêu (một người bạn lập trình cùng lớp học sinh lớp 6) đồng hành học Python.
Nhiệm vụ của bạn là nhận xét mã nguồn Python của học sinh một cách dễ thương, khích lệ và tập trung vào lập trình sạch (Clean Code).

BẮT BUỘC ĐÁP ỨNG CÁC NGUYÊN TẮC:
1. KHEN NGỢI: Khen ngợi một điểm tốt trong code của học sinh (ví dụ: cách đặt tên biến rõ ràng, cách dùng vòng lặp, cách sắp xếp câu lệnh ngăn nắp).
2. GỢI Ý CẢI TIẾN: Đưa ra 1 gợi ý nhẹ nhàng để code sạch hơn (ví dụ: thụt lề chuẩn, thay các con số cố định bằng biến, hoặc rút gọn câu lệnh trùng lặp).
3. KHÍCH LỆ: Kết thúc bằng lời chúc dễ thương và tích cực để học sinh có thêm động lực học tiếp.
4. RÀNG BUỘC NGHIÊM NGẶT: Không viết sẵn code giải hoàn chỉnh hay đáp án sửa lỗi. Chỉ nhận xét và hướng dẫn ý tưởng.
5. PHONG CÁCH: Dùng tiếng Việt đơn giản cho trẻ 11-12 tuổi. Sử dụng xưng hô thân mật như "tớ", "cậu", "hihi", "nhé". Phản hồi ngắn gọn trong 5-6 câu.
    `.trim();

    const userPrompt = `
Bài học: ${lesson.title}
Mục tiêu bài học: ${lesson.objective}
Mã nguồn hiện tại của học sinh:
\`\`\`python
${code}
\`\`\`

Hãy đưa ra nhận xét mã nguồn thân thiện và khích lệ cho tớ nhé!
    `.trim();

    const entitlement = getHintEntitlement(user);
    const reviewResult = await generateHintWithFallback({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      modelOrder: entitlement.modelOrder,
      maxCompletionTokens: 500,
    });

    const reviewText = reviewResult.hint || 'Chưa nhận được nhận xét từ Groq.';

    const coinsEarned = alreadyRewarded ? 0 : COINS_CODE_REVIEW;
    const xpEarned = alreadyRewarded ? 0 : XP_CODE_REVIEW;

    await query(
      `INSERT INTO user_lesson_reviews (user_id, lesson_id, code_snapshot, ai_review_text, coins_earned, xp_earned)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, lesson.id, code, reviewText, coinsEarned, xpEarned]
    );

    let totalXp = 0;
    let totalCoins = 0;
    let leveledUp = false;
    let oldLevelData = null;
    let newLevelData = null;

    if (!alreadyRewarded) {
      await query(
        `INSERT INTO user_xp_log (user_id, xp_amount, source, lesson_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, source, lesson_id) DO NOTHING`,
        [user.id, xpEarned, XP_SOURCES.CODE_REVIEW, lesson.id]
      );

      const oldXpRows = await query(`SELECT COALESCE(total_xp, 0) AS total_xp FROM user_xp WHERE user_id = $1`, [user.id]);
      const oldTotalXp = oldXpRows[0]?.total_xp || 0;
      oldLevelData = getLevelFromXp(oldTotalXp);

      const xpUpsertRows = await query(
        `INSERT INTO user_xp (user_id, total_xp)
         VALUES ($1, $2)
         ON CONFLICT (user_id)
         DO UPDATE SET total_xp = user_xp.total_xp + EXCLUDED.total_xp
         RETURNING total_xp`,
        [user.id, xpEarned]
      );
      totalXp = xpUpsertRows[0]?.total_xp || 0;
      newLevelData = getLevelFromXp(totalXp);
      leveledUp = newLevelData.level > oldLevelData.level;

      const coinsUpsertRows = await query(
        `INSERT INTO user_coins (user_id, coins)
         VALUES ($1, $2)
         ON CONFLICT (user_id)
         DO UPDATE SET coins = user_coins.coins + EXCLUDED.coins
         RETURNING coins`,
        [user.id, coinsEarned]
      );
      totalCoins = coinsUpsertRows[0]?.coins || 0;
    } else {
      const xpRows = await query(`SELECT COALESCE(total_xp, 0) AS total_xp FROM user_xp WHERE user_id = $1`, [user.id]);
      totalXp = xpRows[0]?.total_xp || 0;
      newLevelData = getLevelFromXp(totalXp);

      const coinsRows = await query(`SELECT COALESCE(coins, 0) AS coins FROM user_coins WHERE user_id = $1`, [user.id]);
      totalCoins = coinsRows[0]?.coins || 0;
    }

    const xpData = {
      totalXp,
      ...newLevelData,
      xpAdded: xpEarned,
      leveledUp,
      oldLevel: oldLevelData?.level || newLevelData.level,
      newLevel: newLevelData.level,
    };

    response.json({
      reviewText,
      alreadyRewarded,
      coinsEarned,
      xpEarned,
      totalCoins,
      xpData,
      model: reviewResult.model,
    });
  } catch (error) {
    if (error instanceof GroqRequestError && (error.status === 429 || error.status >= 500)) {
      response.status(429).json({
        message: 'Hệ thống gợi ý AI đang bận hoặc tạm chạm giới hạn. Bạn thử lại sau ít phút nhé.',
      });
      return;
    }

    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to generate code review.',
    });
  }
}

export async function getChatHistoryHandler(request, response) {
  const lessonIdStr = request.query.lessonId;
  const lessonId = lessonIdStr ? Number(lessonIdStr) : null;
  const challengeIdStr = request.query.challengeId;
  const challengeId = challengeIdStr ? Number(challengeIdStr) : null;

  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    const messages = await query(
      `SELECT sender, message_text AS "messageText", created_at AS "createdAt"
       FROM user_chat_messages
       WHERE user_id = $1 
         AND (
           ($2::integer IS NOT NULL AND lesson_id = $2)
           OR ($3::integer IS NOT NULL AND challenge_id = $3)
           OR (lesson_id IS NULL AND challenge_id IS NULL AND $2 IS NULL AND $3 IS NULL)
         )
       ORDER BY created_at ASC
       LIMIT 15`,
      [user.id, lessonId, challengeId]
    );

    response.json({
      messages,
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to retrieve chat history.',
    });
  }
}

export async function chatHandler(request, response) {
  const { lessonId, challengeId, message, code } = getRequestBody(request);

  if (!groqApiKey) {
    response.status(500).json({
      message: 'GROQ_API_KEY is not configured on the server.',
    });
    return;
  }

  if (!message || !message.trim()) {
    response.status(400).json({
      message: 'Missing message.',
    });
    return;
  }

  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    // Check if pet is sleeping (fullness === 0)
    const pet = await getAndUpdateActivePet(user.id);
    if (pet && pet.fullness === 0) {
      response.status(400).json({
        message: 'Thú cưng của bạn đã ngủ thiếp đi vì quá đói! Hãy cho ăn để đánh thức thú cưng dậy trước khi trò chuyện nhé. 💤'
      });
      return;
    }

    let lesson = null;
    if (lessonId) {
      lesson = await getLessonById(lessonId);
    }

    let challenge = null;
    if (challengeId) {
      const challenges = await query(`
        SELECT id, title, description, starter_code
        FROM challenges
        WHERE id = $1 AND is_active = true
        LIMIT 1
      `, [challengeId]);
      challenge = challenges[0] || null;
    }

    const history = await query(
      `SELECT sender, message_text
       FROM user_chat_messages
       WHERE user_id = $1 
         AND (
           ($2::integer IS NOT NULL AND lesson_id = $2)
           OR ($3::integer IS NOT NULL AND challenge_id = $3)
           OR (lesson_id IS NULL AND challenge_id IS NULL AND $2 IS NULL AND $3 IS NULL)
         )
       ORDER BY created_at ASC
       LIMIT 10`,
      [user.id, lessonId || null, challengeId || null]
    );

    const systemPrompt = `
Bạn là Mascot AI đáng yêu (một người bạn lập trình cùng lớp học sinh lớp 6) đồng hành học Python.
Nhiệm vụ của bạn là trò chuyện, giải đáp thắc mắc của học sinh về lập trình Python, đặc biệt là bài học hoặc thử thách hiện tại nếu học sinh hỏi.

BẮT BUỘC ĐÁP ỨNG CÁC NGUYÊN TẮC:
1. PHONG CÁCH: Dùng xưng hô thân mật "tớ" và "cậu", dùng các từ cảm thán như "nhé", "hihi", "nha". Sử dụng các ví dụ thực tế gần gũi với trẻ em 11-12 tuổi (như trò chơi Minecraft, Roblox, vẽ tranh, lắp Lego).
2. RÀNG BUỘC NGHIÊM NGẶT: Không viết sẵn code giải hoàn chỉnh hay đáp án sửa lỗi cho bất kỳ bài tập hay thử thách nào. Hãy đặt câu hỏi gợi mở để học sinh tự nghĩ và sửa code.
3. TRẢ LỜI NGẮN GỌN: Phản hồi ngắn gọn, súc tích (khoảng 3-5 câu), tránh dài dòng gây nản lòng cho học sinh.
    `.trim();

    let contextText = '';
    if (lesson) {
      contextText = `Bài học: ${lesson.title}\nMục tiêu bài học: ${lesson.objective}\nStarter code của bài:\n${lesson.starterCode || ''}`;
    } else if (challenge) {
      contextText = `Thử thách: ${challenge.title}\nYêu cầu thử thách: ${challenge.description}\nStarter code của thử thách:\n${challenge.starter_code || ''}`;
    } else {
      contextText = 'Không có thông tin bài học hay thử thách cụ thể.';
    }

    const editorCodeContext = code ? `Mã nguồn hiện tại trong editor của học sinh:\n\`\`\`python\n${code}\n\`\`\`` : 'Học sinh chưa viết code gì trong editor.';

    const contextPrompt = `
[Bối cảnh học tập]
${contextText}
${editorCodeContext}
    `.trim();

    const messagesToSend = [
      { role: 'system', content: systemPrompt },
      { role: 'system', content: contextPrompt },
    ];

    for (const msg of history) {
      messagesToSend.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.message_text,
      });
    }

    messagesToSend.push({
      role: 'user',
      content: message,
    });

    const entitlement = getHintEntitlement(user);
    const result = await generateHintWithFallback({
      messages: messagesToSend,
      modelOrder: entitlement.modelOrder,
      maxCompletionTokens: 500,
    });

    const aiResponse = result.hint || 'Tớ chưa nghĩ ra câu trả lời.';

    await query(
      `INSERT INTO user_chat_messages (user_id, lesson_id, challenge_id, sender, message_text)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, lessonId || null, challengeId || null, 'user', message]
    );

    await query(
      `INSERT INTO user_chat_messages (user_id, lesson_id, challenge_id, sender, message_text)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, lessonId || null, challengeId || null, 'ai', aiResponse]
    );

    response.json({
      message: aiResponse,
    });
  } catch (error) {
    if (error instanceof GroqRequestError && (error.status === 429 || error.status >= 500)) {
      response.status(429).json({
        message: 'Tớ hơi bận một chút, cậu chờ tớ vài giây rồi hỏi lại nhé! Hihi.',
      });
      return;
    }

    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to process chat message.',
    });
  }
}



