const ASSET_TYPES = [
  { value: 'hat', label: 'Hat' },
  { value: 'jacket', label: 'Jacket' },
  { value: 'glasses', label: 'Glasses' },
  { value: 'pet', label: 'Pet' },
  { value: 'keyboard', label: 'Keyboard' },
  { value: 'backpack', label: 'Backpack' },
];

const RARITY_TIERS = ['common', 'rare', 'epic', 'legendary'] as const;

const RARITY_COLORS: Record<string, string> = {
  common: '#757687',
  rare: '#437e6b',
  epic: '#705d00',
  legendary: '#3045e3',
};

export function AccessoriesPage() {
  return (
    <div className="accessories-layout">
      <header className="accessories-header-section">
        <h2 className="accessories-header-section__title">Upload New Asset</h2>
        <p className="accessories-header-section__subtitle">
          Expand the PythonQuest world with a brand new physical or digital artifact.
        </p>
      </header>

      <div className="accessories-grid">
        {/* Left Column: Primary Details */}
        <div className="accessories-main-column">
          {/* Basic Info Card */}
          <div className="accessories-card">
            <div className="accessories-form-grid">
              <div className="accessories-form-group accessories-form-group--full">
                <label className="accessories-form-label">Asset Name</label>
                <input
                  className="accessories-input"
                  placeholder="e.g. Glowing Syntax Scarf"
                  type="text"
                />
              </div>

              <div className="accessories-form-group">
                <label className="accessories-form-label">Asset Type</label>
                <select className="accessories-select">
                  {ASSET_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="accessories-form-group">
                <label className="accessories-form-label">Rarity Tier</label>
                <div className="accessories-rarity-group">
                  {RARITY_TIERS.map((tier, index) => (
                    <button
                      key={tier}
                      className={`accessories-rarity-btn${index === 0 ? ' is-active' : ''}`}
                      type="button"
                      style={{
                        '--rarity-color': RARITY_COLORS[tier],
                      } as React.CSSProperties}
                    >
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="accessories-form-group accessories-form-group--full">
                <label className="accessories-form-label">Description</label>
                <textarea
                  className="accessories-textarea"
                  placeholder="How does this item help the Python Quest hero?"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Image Upload Area */}
          <div className="accessories-card accessories-upload-card">
            <div className="accessories-upload-stripe" />
            <label className="accessories-form-label">Visual Asset</label>
            <div className="accessories-dropzone">
              <div className="accessories-dropzone__icon">
                <span className="material-symbols-outlined">cloud_upload</span>
              </div>
              <h3 className="accessories-dropzone__title">Drag and drop your asset file</h3>
              <p className="accessories-dropzone__hint">
                Supports PNG, SVG, and WEBP (Recommended 1024x1024)
              </p>
              <button className="accessories-dropzone__browse" type="button">
                Browse Files
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Actions */}
        <div className="accessories-side-column">
          {/* Stats Configurator Card */}
          <div className="accessories-card accessories-stats-card">
            <h3 className="accessories-stats-title">
              <span className="material-symbols-outlined">query_stats</span>
              Stats Config
            </h3>

            <div className="accessories-stats-list">
              <div className="accessories-stat-row">
                <div className="accessories-stat-header">
                  <label className="accessories-stat-label">Coding Speed</label>
                  <span className="accessories-stat-value">85</span>
                </div>
                <div className="accessories-slider-track">
                  <div className="accessories-slider-fill accessories-slider-fill--gold" style={{ width: '85%' }} />
                </div>
                <input className="accessories-slider" type="range" defaultValue="85" />
              </div>

              <div className="accessories-stat-row">
                <div className="accessories-stat-header">
                  <label className="accessories-stat-label">Logic Power</label>
                  <span className="accessories-stat-value">42</span>
                </div>
                <div className="accessories-slider-track">
                  <div className="accessories-slider-fill accessories-slider-fill--mint" style={{ width: '42%' }} />
                </div>
                <input className="accessories-slider" type="range" defaultValue="42" />
              </div>

              <div className="accessories-stat-row">
                <div className="accessories-stat-header">
                  <label className="accessories-stat-label">Debug Defense</label>
                  <span className="accessories-stat-value">60</span>
                </div>
                <div className="accessories-slider-track">
                  <div className="accessories-slider-fill" style={{ width: '60%' }} />
                </div>
                <input className="accessories-slider" type="range" defaultValue="60" />
              </div>
            </div>

            <div className="accessories-rank-footer">
              <div className="accessories-rank-badge">
                A+
              </div>
              <div className="accessories-rank-info">
                <p className="accessories-rank-info__title">Calculated Rank</p>
                <p className="accessories-rank-info__subtitle">Based on power levels</p>
              </div>
            </div>
          </div>

          {/* Preview Card */}
          <div className="accessories-preview-card">
            <p className="accessories-preview-label">Live Preview</p>
            <div className="accessories-preview-stage">
              <img
                alt="Asset preview"
                className="accessories-preview-image"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHw5hExUAL2xDOXgAmJvZR_EhVpSYcLHMLwu6mBUYz07CTVntP3WnndTYDjPX984Jp9F_0jV2x2-xe90zLeDUifcuZZ4aaheG34qLtr4k8jh289pX4SnB5B5MhB5XfSogo9OngK3dAbNQnayQ5ePwR_8O_Q8q_pTaBrAIy2xa9DJkxDny9PRswBA5HJUEvH8n2y94Ra9UJ351dXh05v87mmyAD0eSV1tB5YxJBRF6Qm9CX4KrtIggQsEvbKiJD9EmC1OM-_eAxwcry"
              />
              <div className="accessories-preview-badge">PREVIEW</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="accessories-actions">
            <button className="accessories-btn accessories-btn--primary" type="button">
              <span className="material-symbols-outlined">rocket_launch</span>
              Publish to Game
            </button>
            <button className="accessories-btn accessories-btn--danger" type="button">
              <span className="material-symbols-outlined">delete_forever</span>
              Discard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}