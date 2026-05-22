import { promisify } from 'node:util';
import { put } from '@vercel/blob';
import { execute, query } from '../db.mjs';

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

