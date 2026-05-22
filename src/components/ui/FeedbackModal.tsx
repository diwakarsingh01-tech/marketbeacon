import React, { useState } from 'react';
import { 
  Star, 
  X, 
  MessageSquare, 
  Send, 
  AlertCircle, 
  Layout, 
  Target, 
  Zap, 
  HelpCircle 
} from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DISPOSITIONS = [
  { id: 'UI/UX', label: 'UI/UX Experience', icon: Layout },
  { id: 'ACCURACY', label: 'Strategy Accuracy', icon: Target },
  { id: 'MISSING', label: 'Missing Features', icon: Zap },
  { id: 'SPEED', label: 'Performance/Speed', icon: Zap },
  { id: 'BUG', label: 'Bug Report', icon: AlertCircle },
  { id: 'OTHER', label: 'General Feedback', icon: HelpCircle },
];

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [disposition, setDisposition] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('mb_token')}`
        },
        body: JSON.stringify({
          rating,
          disposition,
          comment,
          timestamp: new Date().toISOString(),
          url: window.location.href
        })
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          setRating(0);
          setDisposition('');
          setComment('');
        }, 2000);
      }
    } catch (error) {
      console.error('Feedback submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-tight">Institutional Feedback</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Continuous Quality Audit</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="px-8 py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Send className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Audit Received!</h2>
            <p className="text-slate-500 font-medium">Your feedback has been logged into our quality system.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Star Rating */}
            <div className="space-y-3 text-center">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Experience</label>
              <div className="flex items-center justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none transition-transform active:scale-90"
                  >
                    <Star 
                      className={`h-8 w-8 transition-colors ${
                        (hoveredRating || rating) >= star 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'text-slate-200'
                      }`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Disposition Dropdown */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Feedback Type</label>
              <div className="grid grid-cols-2 gap-2">
                {DISPOSITIONS.map((item) => {
                  const Icon = item.icon;
                  const isActive = disposition === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDisposition(item.id)}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-xl border text-left transition-all ${
                        isActive 
                          ? 'bg-blue-50 border-blue-600 text-blue-700' 
                          : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-300'}`} />
                      <span className="text-[11px] font-black tracking-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment Area */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Additional Commentary</label>
              <textarea
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your detailed institutional audit findings..."
                className="w-full h-32 bg-slate-50 border-none rounded-2xl p-4 text-[13px] font-medium focus:ring-2 focus:ring-blue-600/20 transition-all placeholder:text-slate-300 resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              disabled={isSubmitting || !rating || !disposition}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black text-[13px] uppercase tracking-widest transition-all shadow-xl shadow-slate-200 flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Audit Report</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
