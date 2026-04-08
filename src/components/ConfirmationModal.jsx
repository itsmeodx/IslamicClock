import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  isArabic,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md z-[60] rounded-none"
          />

          {/* Modal Container */}
          <div className="absolute inset-0 flex items-center justify-center p-6 z-[70] pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="heritage-card max-w-sm w-full text-center pointer-events-auto !p-10"
              dir={isArabic ? "rtl" : "ltr"}
            >
              <div className="geometric-bg opacity-10" />

              <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-heritage-amber/20 flex items-center justify-center mb-2">
                  <AlertTriangle className="w-8 h-8 text-heritage-amber animate-pulse" />
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white tracking-wide">
                    {title}
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed px-2">
                    {message}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                  <button
                    onClick={onConfirm}
                    className="heritage-button !py-3 !px-4 text-sm uppercase tracking-widest"
                  >
                    {confirmText}
                  </button>
                  <button
                    onClick={onClose}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all active:scale-95"
                  >
                    {cancelText}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
