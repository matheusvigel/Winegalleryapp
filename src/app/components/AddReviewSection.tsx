import { useState } from 'react';
import { Camera, X, Star, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface AddReviewSectionProps {
  itemId: string;
  itemName?: string;
  onAddReview: (itemId: string, review: { photo?: string; comment: string; rating: number }) => Promise<void>;
}

export function AddReviewSection({ itemId, itemName, onAddReview }: AddReviewSectionProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const getTotalPoints = () => {
    let pts = 0;
    if (photo) pts += 3;                       // action: 'photo'
    if (comment.trim() || rating > 0) pts += 3; // action: 'review'
    return pts;
  };

  const handleSubmit = async () => {
    if (!comment.trim() && !photo && !rating) return;
    await onAddReview(itemId, { photo: photo ?? undefined, comment, rating });
    setPhoto(null);
    setComment('');
    setRating(0);
  };

  return (
    <div className="space-y-4">
      {/* Incentive card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-5 text-white"
      >
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="w-6 h-6" />
          <div>
            <h3 className="font-bold text-lg">Compartilhe sua experiência!</h3>
            <p className="text-yellow-50 text-sm">Ganhe pontos extras na plataforma</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[['Foto', '+3'], ['Comentário', '+3'], ['Avaliação', '✓']].map(([label, pts]) => (
            <div key={label} className="bg-white/20 rounded-lg py-2">
              <div className="text-lg font-bold">{pts}</div>
              <div className="text-xs text-yellow-50">{label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Photo */}
      <div className="bg-white rounded-2xl p-5 shadow-lg">
        <label className="block">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-900">📸 Adicione uma foto</span>
            <span className="text-sm text-orange-600 font-medium">+3 pontos</span>
          </div>
          {!photo ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">Toque para adicionar uma foto</p>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden">
              <img src={photo} alt="Review" className="w-full h-56 object-cover" />
              <button
                onClick={(e) => { e.preventDefault(); setPhoto(null); }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
        </label>
      </div>

      {/* Rating */}
      <div className="bg-white rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-gray-900">⭐ Sua avaliação</span>
          <span className="text-sm text-orange-600 font-medium">incluso</span>
        </div>
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onClick={() => setRating(star)} className="transition-transform hover:scale-110">
              <Star className={`w-10 h-10 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-center text-sm text-gray-600 mt-2">
            {rating === 5 ? 'Excepcional! 🎉' : rating === 4 ? 'Muito bom! 👏' : rating === 3 ? 'Bom! 👍' : rating === 2 ? 'Regular 😐' : 'Não gostei 😕'}
          </p>
        )}
      </div>

      {/* Comment */}
      <div className="bg-white rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-gray-900">💭 Seu comentário</span>
          <span className="text-sm text-orange-600 font-medium">+3 pontos</span>
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={`Como foi sua experiência${itemName ? ` com ${itemName}` : ''}?`}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-gray-500 mt-2">{comment.length}/500 caracteres</p>
      </div>

      {/* Submit */}
      <AnimatePresence>
        {(photo || comment.trim() || rating > 0) && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>Publicar e ganhar {getTotalPoints()} pontos</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
