import { MobileNavigation } from '../navigate/NavigateNavigation';
import { PracticeHeader } from './PracticeHeader';
import { PracticeSideNav } from './PracticeSideNav';
import type { AuthUser } from '../auth/types';

type PracticePageProps = {
  user: AuthUser;
  onLogout: () => Promise<void> | void;
  onNavigateHome: () => void;
};

export function PracticePage({ user, onLogout, onNavigateHome }: PracticePageProps) {
  return (
    <div className="quest-page">
      <PracticeHeader user={user} onLogout={onLogout} />

      <div className="quest-layout">
        <PracticeSideNav onNavigateHome={onNavigateHome} />

        {/* Main Content */}
        <main className="practice-main">
          <div className="practice-content">
            {/* Left Column */}
            <div className="practice-center">
              {/* Daily Streak Section */}
              <section className="practice-streak">
                <div className="practice-streak__header">
                  <h2 className="practice-streak__title">Chuỗi ngày rực rỡ</h2>
                  <div className="practice-streak__badge">
                    <span className="material-symbols-outlined practice-streak__fire streak-fire">local_fire_department</span>
                    <span>12 Ngày</span>
                  </div>
                </div>
                <div className="practice-streak__calendar">
                  <div className="practice-streak__day">
                    <span className="practice-streak__day-label">T2</span>
                    <div className="practice-streak__day-box practice-streak__day-box--done">
                      <span className="material-symbols-outlined">local_fire_department</span>
                    </div>
                  </div>
                  <div className="practice-streak__day">
                    <span className="practice-streak__day-label">T3</span>
                    <div className="practice-streak__day-box practice-streak__day-box--done">
                      <span className="material-symbols-outlined">local_fire_department</span>
                    </div>
                  </div>
                  <div className="practice-streak__day practice-streak__day--today">
                    <span className="practice-streak__day-label">T4</span>
                    <div className="practice-streak__day-box practice-streak__day-box--today">
                      <span className="material-symbols-outlined">star</span>
                      <div className="practice-streak__day-today-dot" />
                    </div>
                  </div>
                  <div className="practice-streak__day practice-streak__day--locked">
                    <span className="practice-streak__day-label">T5</span>
                    <div className="practice-streak__day-box practice-streak__day-box--locked">
                      <span className="material-symbols-outlined">lock</span>
                    </div>
                  </div>
                  <div className="practice-streak__day practice-streak__day--locked">
                    <span className="practice-streak__day-label">T6</span>
                    <div className="practice-streak__day-box practice-streak__day-box--locked">
                      <span className="material-symbols-outlined">lock</span>
                    </div>
                  </div>
                  <div className="practice-streak__day practice-streak__day--locked">
                    <span className="practice-streak__day-label">T7</span>
                    <div className="practice-streak__day-box practice-streak__day-box--locked">
                      <span className="material-symbols-outlined">lock</span>
                    </div>
                  </div>
                  <div className="practice-streak__day practice-streak__day--locked">
                    <span className="practice-streak__day-label">CN</span>
                    <div className="practice-streak__day-box practice-streak__day-box--locked">
                      <span className="material-symbols-outlined">lock</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Daily Challenges Section */}
              <section className="practice-challenges">
                <h2 className="practice-challenges__title">Thử thách hôm nay</h2>

                <div className="practice-challenge-card">
                  <div className="practice-challenge-card__content">
                    <div className="practice-challenge-card__icon practice-challenge-card__icon--primary">
                      <span className="material-symbols-outlined">smart_toy</span>
                    </div>
                    <div className="practice-challenge-card__info">
                      <h3 className="practice-challenge-card__name">Giải cứu Py-Bot</h3>
                      <p className="practice-challenge-card__desc">
                        Sử dụng lệnh <code className="practice-code-inline">print()</code> để gọi đồng đội.
                      </p>
                      <div className="practice-challenge-card__meta">
                        <span className="practice-challenge-card__difficulty practice-challenge-card__difficulty--easy">
                          <span className="material-symbols-outlined">signal_cellular_alt_1_bar</span> Dễ
                        </span>
                        <span className="practice-challenge-card__reward">
                          <span className="material-symbols-outlined">monetization_on</span> +50
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="practice-challenge-card__btn">Bắt đầu</button>
                </div>

                <div className="practice-challenge-card">
                  <div className="practice-challenge-card__content">
                    <div className="practice-challenge-card__icon practice-challenge-card__icon--secondary">
                      <span className="material-symbols-outlined">diamond</span>
                    </div>
                    <div className="practice-challenge-card__info">
                      <h3 className="practice-challenge-card__name">Thu thập kim cương</h3>
                      <p className="practice-challenge-card__desc">
                        Sử dụng vòng lặp <code className="practice-code-inline">for</code> để lấy hết quà.
                      </p>
                      <div className="practice-challenge-card__meta">
                        <span className="practice-challenge-card__difficulty practice-challenge-card__difficulty--medium">
                          <span className="material-symbols-outlined">signal_cellular_alt_2_bar</span> Trung bình
                        </span>
                        <span className="practice-challenge-card__reward">
                          <span className="material-symbols-outlined">monetization_on</span> +120
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="practice-challenge-card__btn">Bắt đầu</button>
                </div>

                <div className="practice-challenge-card">
                  <div className="practice-challenge-card__content">
                    <div className="practice-challenge-card__icon practice-challenge-card__icon--error">
                      <span className="material-symbols-outlined">bug_report</span>
                    </div>
                    <div className="practice-challenge-card__info">
                      <h3 className="practice-challenge-card__name">Sửa lỗi mã nguồn</h3>
                      <p className="practice-challenge-card__desc">Tìm và sửa lỗi thụt lề trong đoạn code sau.</p>
                      <div className="practice-challenge-card__meta">
                        <span className="practice-challenge-card__difficulty practice-challenge-card__difficulty--hard">
                          <span className="material-symbols-outlined">signal_cellular_alt</span> Khó
                        </span>
                        <span className="practice-challenge-card__reward">
                          <span className="material-symbols-outlined">monetization_on</span> +250
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="practice-challenge-card__btn">Bắt đầu</button>
                </div>
              </section>

              {/* Reward Store Section */}
              <section className="practice-store">
                <div className="practice-store__header">
                  <h2 className="practice-store__title">Cửa hàng đổi quà</h2>
                  <button className="practice-store__view-all">Xem tất cả</button>
                </div>

                <div className="practice-store__grid">
                  <div className="practice-store__item">
                    <div className="practice-store__item-image">
                      <img
                        alt="Top Hat Accessory"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIhYr7z6DvB0qBwYWb3UYcikDHG-W5FiO1mT7WR39e0amba40WHMYg52S5OAWnkdmViC5wFSp14Du4pO0xJlJXVSpYV_uA1VXv6SqNVmJxofSBWMyA-ghrtnWGXysN9hYpvcAW15CVLpPE9uO6Xokdknmjm1xwC8rRa00TjaFTNgl1Sm5ChwQ8nt6Hk0NqsltqYqYnp6bGooTLkQ8zxFlgKA7rEuSsrNnVdy3XNCy7r1Y5pszNRMmezdgmKf2DAL_qFV9Vgz6FAKzr"
                      />
                      <div className="practice-store__item-badge">MỚI!</div>
                    </div>
                    <h4 className="practice-store__item-name">Mũ Quý Tộc</h4>
                    <div className="practice-store__item-footer">
                      <span className="practice-store__item-price">
                        <span className="material-symbols-outlined">monetization_on</span>
                        450
                      </span>
                      <button className="practice-store__item-btn">
                        <span className="material-symbols-outlined">add_shopping_cart</span>
                      </button>
                    </div>
                  </div>

                  <div className="practice-store__item practice-store__item--featured">
                    <div className="practice-store__item-image">
                      <img
                        alt="Cyber Sunglasses"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDt0Mesrz-f1SaRCH3abPnG16ERIKzFqN-w8PC5EHWxZnD9vJkeYaZgC4XOJa6m-Dw6WlKY-UXQM8LOpeNinCMznmSQ2i4XQQdG6kQ6dUZ4X85I_v36pcZvJtEif22O47dcZ7huX8CR4h4xdmHSPTWq0XxmbBa_V8CeHOk650ct_9j1aiJVNK6iHQ68qJ1vIGbrN95w-6626j4Q_wfjjcrMX6ZS4sdCYstkgBx9s9yhGOyPsy7mvZdIF_NKnIwsCrI_16sMMKo8qPPy"
                      />
                    </div>
                    <h4 className="practice-store__item-name">Kính Cyber</h4>
                    <div className="practice-store__item-footer">
                      <span className="practice-store__item-price">
                        <span className="material-symbols-outlined">monetization_on</span>
                        800
                      </span>
                      <button className="practice-store__item-btn">
                        <span className="material-symbols-outlined">add_shopping_cart</span>
                      </button>
                    </div>
                  </div>

                  <div className="practice-store__item">
                    <div className="practice-store__item-image">
                      <img
                        alt="Rocket Backpack"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYTCEcwNZ9EyyDpZN9P6e2_bV1PPkrI3cH1dwlJVVZWc5vnQaWqNGRXQUkNlD9ohPCjxPNzV9rc0CmeICx43RgUKdwsnRVMmI5KhVQrtuDfl4bD9rUKcOObaUQ-bl7gnVBRmSnP4TghmrnipL3C3U06eq97t8dkcDT4NQ2xV7bAyayOjeAE8chxYM8LnzxhblFzZQJKCiYhm8pkhVS9xzozaxTRXmsU0eqf89kPsopfzIkOWnigegbOal6ioB-96iA7_wrQ8-XdMhq"
                      />
                    </div>
                    <h4 className="practice-store__item-name">Balo Tên Lửa</h4>
                    <div className="practice-store__item-footer">
                      <span className="practice-store__item-price">
                        <span className="material-symbols-outlined">monetization_on</span>
                        1,200
                      </span>
                      <button className="practice-store__item-btn">
                        <span className="material-symbols-outlined">add_shopping_cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column - Leaderboard */}
            <div className="practice-sidebar">
              <section className="practice-leaderboard">
                <div className="practice-leaderboard__header">
                  <h3 className="practice-leaderboard__title">Bảng xếp hạng</h3>
                  <span className="material-symbols-outlined practice-leaderboard__icon">leaderboard</span>
                </div>

                <div className="practice-leaderboard__list">
                  <div className="practice-leaderboard__item practice-leaderboard__item--top">
                    <div className="practice-leaderboard__item-rank">
                      <div className="practice-leaderboard__item-rank-num">1</div>
                    </div>
                    <img
                      alt="User Avatar"
                      className="practice-leaderboard__item-avatar"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBiUQ10OoYwrGRRRPNEx4mfJWTLIwDAT7DojIQf5rrgPUW_sRdebR5k8GzLPPMOmN6p-nYvFzIN01sIJ32WZO6s2slJbyKIJWTQhNc0XauOLopBFBXQL31x_y9YAp2Ut2A4UZznL4HnLUbve-ExZy1zaUU1Vz2jglxby_gCBDXS5FZ-IpLHyIivod9QTOIRq5vqzTsaD5kB-2gs51G9Fn8ngKSYfxKTFcrGCu1QvopdTVtPtiv1HixnyF3C3Hnpbr_wxHm_juV9Mwqq"
                    />
                    <div className="practice-leaderboard__item-info">
                      <p className="practice-leaderboard__item-name">Minh Anh</p>
                      <p className="practice-leaderboard__item-zone">Lâu đài Python</p>
                    </div>
                    <p className="practice-leaderboard__item-xp">4,250 XP</p>
                  </div>

                  <div className="practice-leaderboard__item">
                    <div className="practice-leaderboard__item-rank">
                      <div className="practice-leaderboard__item-rank-num practice-leaderboard__item-rank-num--silver">2</div>
                    </div>
                    <img
                      alt="User Avatar"
                      className="practice-leaderboard__item-avatar"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9FF1Z5_rBQXjZbb6V_EGmsem0IDp8hc7-s0VdS-oACRN3sXNpeEej4RHpRpMezfwn5QhmQiG-e5o0sLd4CJ2n4pXrBF0KJ3O1_REwedA8j94Y5c44aJi-SBoB0JAigXGT_icT8KGb3LD4zP928P9xVVzuS2dNY3VgoHwdkfFgu4foYRJYxsTdmayTFBAlt_eFelh5PVKMAEA-iHE_VtPmyE8wsKD0JCisqityJXfzNbXrYkN3ZqRBtBwjtrfPlRRww4hysFE0RF75"
                    />
                    <div className="practice-leaderboard__item-info">
                      <p className="practice-leaderboard__item-name">Bảo Nam</p>
                      <p className="practice-leaderboard__item-zone">Thung lũng Loop</p>
                    </div>
                    <p className="practice-leaderboard__item-xp">3,980 XP</p>
                  </div>

                  <div className="practice-leaderboard__item">
                    <div className="practice-leaderboard__item-rank">
                      <div className="practice-leaderboard__item-rank-num practice-leaderboard__item-rank-num--bronze">3</div>
                    </div>
                    <img
                      alt="User Avatar"
                      className="practice-leaderboard__item-avatar"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmMIvrwEGCeF0rI8ELjYXgBUW1fHr1cqRYskOoSfiJ-iYLcUohnNr0lvAfrsC9p5MG6yk7RDSCyFYQ7It9bJVTDRqx0Ctscq9ipDuIW_cSLOO_krJc3sXGO_hWrw8u7nVyNIJPTs2pYTr6EBw-faSzga7pWHlTCPgHdPrt3eOqLyJJR9aI2zYbZiy0CbDc87WvhurZ0ahaauYvv0qKOEYfzHGHvuet2BE1D_DQk1UHgtVOgalqaJ8fa6FvJsSZYG6IXtzwgbpEPq6w"
                    />
                    <div className="practice-leaderboard__item-info">
                      <p className="practice-leaderboard__item-name">Linh Chi</p>
                      <p className="practice-leaderboard__item-zone">Rừng Biến số</p>
                    </div>
                    <p className="practice-leaderboard__item-xp">3,720 XP</p>
                  </div>

                  <div className="practice-leaderboard__user">
                    <div className="practice-leaderboard__item-info">
                      <p className="practice-leaderboard__item-name">Bạn (Junior Coder)</p>
                      <p className="practice-leaderboard__item-zone">Tiến lên nào!</p>
                    </div>
                    <img
                      alt="User Avatar"
                      className="practice-leaderboard__item-avatar practice-leaderboard__item-avatar--user"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVwFLztDmlH7FtEv3_OBl31Yp_tXDVTQNtSv0F5gwRvWux6xj0hzHQeSgOp5u64PPldaZGBzrPfIO8tEjZUWsAzbzQEN70osrsKEvIv5S7Yr-Vn_8PpKLB9b8WRLkINrBGUwCGbUH_f3XfTNbazRt4kKWBtB4dTr710AJWss6fnB-Azz9XTnhsxVCktU4D581WZLXxAUM6ZTL-bJaqoZe5HqwkyREM0JcFprDTfiDKpP9gpr81cl4E7pB4_kVMf6BM_bFaXmKTqYVo"
                    />
                    <div className="practice-leaderboard__item-rank">
                      <div className="practice-leaderboard__item-rank-num practice-leaderboard__item-rank-num--user">15</div>
                    </div>
                    <p className="practice-leaderboard__item-xp">1,250 XP</p>
                  </div>
                </div>

                <button className="practice-leaderboard__view-all">Xem toàn bộ bảng</button>
              </section>

              {/* Tip Widget */}
              <div className="practice-tip">
                <span className="material-symbols-outlined practice-tip__icon">lightbulb</span>
                <h4 className="practice-tip__title">
                  <span className="material-symbols-outlined">tips_and_updates</span> Mẹo nhỏ
                </h4>
                <p className="practice-tip__content">
                  Hoàn thành "Thử thách hôm nay" trước 12h trưa để nhận được nhân đôi (X2) điểm kinh nghiệm đấy!
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      <MobileNavigation />
    </div>
  );
}