import type { UserPet } from '../types';
import '../pet.css';

interface PetWidgetProps {
  pet: UserPet | null;
  tone: 'idle' | 'success' | 'error';
}

export function PetWidget({ pet, tone }: PetWidgetProps) {
  if (!pet) return null;

  // Determine current image based on level
  const getPetImage = () => {
    if (pet.level === 1) return pet.imageBaby;
    if (pet.level >= 2 && pet.level <= 4) return pet.imageTeen;
    if (pet.level >= 5 && pet.level <= 9) return pet.imageAdult;
    return pet.imageMaster;
  };

  // Determine message deterministically based on exact state
  const getBubbleText = () => {
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
      </div>
      <div className="pet-bubble-container">
        <strong>{pet.nickname}:</strong>
        <p style={{ margin: '4px 0 0 0', color: 'inherit', opacity: 0.85 }}>{bubbleText}</p>
      </div>
    </div>
  );
}
