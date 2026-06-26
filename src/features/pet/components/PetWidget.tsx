import type { UserPet, PetAccessory } from '../types';
import '../pet.css';

interface PetWidgetProps {
  pet: UserPet | null;
  tone: 'idle' | 'success' | 'error';
  activeAccessories?: PetAccessory[];
}

function getAccessoryClass(acc: PetAccessory | undefined) {
  return acc?.accessoryClass || 'accessory-fallback';
}

export function PetWidget({ pet, tone, activeAccessories = [] }: PetWidgetProps) {
  if (!pet) return null;

  // Determine current image based on level and fullness
  const getPetImage = () => {
    if (pet.fullness === 0) {
      return '💤';
    }
    if (pet.fullness < 30) {
      return pet.codeName === 'cyber_cat' ? '😿' : '🥺';
    }
    if (pet.level === 1) return pet.imageBaby;
    if (pet.level >= 2 && pet.level <= 4) return pet.imageTeen;
    if (pet.level >= 5 && pet.level <= 9) return pet.imageAdult;
    return pet.imageMaster;
  };

  // Determine message deterministically based on exact state
  const getBubbleText = () => {
    if (pet.fullness === 0) {
      return '... (Pet đã ngủ thiếp đi vì quá đói, hãy cho Pet ăn để đánh thức nhé) 💤';
    }
    if (tone === 'success') {
      return 'Tuyệt vời! Code chạy mượt mà không lỗi! 🎉';
    }
    if (tone === 'error') {
      return 'Không sao cả, hãy đọc kỹ thông báo lỗi và sửa nhé! 💪';
    }

    // tone === 'idle'
    if (pet.fullness < 30) {
      return 'Tớ đói quá rồi... Cậu làm bài đúng để kiếm Coins cho tớ ăn với! 🥺';
    }
    if (pet.fullness < 80) {
      return 'Tớ hơi đói rồi, làm bài đúng để kiếm đồ ăn nào! 🍖';
    }
    if (pet.fullness >= 100) {
      return 'Tớ no căng bụng rồi! Cảm ơn cậu đã chăm sóc tớ nhé! 🥰';
    }
    return 'Tớ đã ăn no rồi, sẵn sàng đồng hành cùng cậu học Python! 🚀';
  };

  const bubbleText = getBubbleText();

  return (
    <div className="pet-editor-widget" style={{ marginTop: '16px' }}>
      <div className="pet-widget-avatar" title={`Cấp độ ${pet.level}`}>
        {getPetImage()}
        {activeAccessories.map((acc) => (
          <span
            key={acc.id}
            className={`accessory-overlay ${getAccessoryClass(acc)}`}
            title={acc.name}
          >
            {acc.imageData}
          </span>
        ))}
      </div>
      <div className="pet-bubble-container">
        <strong>{pet.nickname}:</strong>
        <p style={{ margin: '4px 0 0 0', color: 'inherit', opacity: 0.85 }}>{bubbleText}</p>
      </div>
    </div>
  );
}
