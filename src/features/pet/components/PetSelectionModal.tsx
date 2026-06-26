import { useState } from 'react';
import type { PetTemplate, UserPet } from '../types';
import { PetAvatar } from './PetAvatar';
import '../pet.css';

interface PetSelectionModalProps {
  show: boolean;
  templates: PetTemplate[];
  onAdopt: (templateId: number, nickname?: string) => Promise<void> | void;
  onDismiss?: () => void;
}

export function PetSelectionModal({ show, templates, onAdopt, onDismiss }: PetSelectionModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!show) return null;

  const handleAdopt = async () => {
    if (selectedTemplateId === null) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onAdopt(selectedTemplateId, nickname.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể nhận nuôi thú cưng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEvolutionStageAvatars = (template: PetTemplate) => {
    const stages: Array<{ level: number; key: string }> = [
      { level: 1, key: 'baby' },
      { level: 3, key: 'teen' },
      { level: 6, key: 'adult' },
      { level: 10, key: 'master' },
    ];
    return (
      <div className="pet-evolution-line" title="Các giai đoạn tiến hóa" style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
        {stages.map((stage) => {
          const mockPet = {
            codeName: template.codeName,
            level: stage.level,
            fullness: 100,
          } as UserPet;
          return (
            <PetAvatar
              key={stage.key}
              pet={mockPet}
              size="small"
              style={{ width: '28px', height: '28px', margin: 0 }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="pet-modal-overlay">
      <div className="pet-modal-card">
        <h2 className="pet-modal-title">Chào mừng bạn đến với Học Viện Pet!</h2>
        <p className="pet-modal-subtitle">Hãy chọn một chú linh thú đồng hành cùng bạn trên con đường chinh phục Python.</p>
        
        {error && <div style={{ color: '#f87171', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</div>}

        <div className="pet-grid">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`pet-option-card ${selectedTemplateId === template.id ? 'selected' : ''}`}
              onClick={() => setSelectedTemplateId(template.id)}
            >
              <PetAvatar
                pet={null}
                template={template}
                size="small"
                style={{ width: '40px', height: '40px', margin: '0 auto 8px' }}
              />
              <div className="pet-option-name">{template.name}</div>
              <p className="pet-option-desc">{template.description}</p>
              {getEvolutionStageAvatars(template)}
            </div>
          ))}
        </div>

        {selectedTemplateId !== null && (
          <div className="pet-nickname-container">
            <label className="pet-nickname-label" htmlFor="pet-nickname">Đặt tên cho thú cưng của bạn:</label>
            <input
              id="pet-nickname"
              type="text"
              className="pet-nickname-input"
              placeholder="Nhập tên riêng (ví dụ: Bé Rồng, Mèo Lười...)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
            />
          </div>
        )}

        <button
          className="pet-adopt-btn pressable"
          onClick={handleAdopt}
          disabled={selectedTemplateId === null || isSubmitting}
        >
          {isSubmitting ? 'Đang nhận nuôi...' : 'Bắt đầu cuộc phiêu lưu!'}
        </button>

        {onDismiss && (
          <button 
            type="button"
            onClick={onDismiss} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#94a3b8', 
              marginTop: '16px', 
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Bỏ qua
          </button>
        )}
      </div>
    </div>
  );
}
