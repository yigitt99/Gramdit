import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare } from 'lucide-react';
import useStore from '../../store';

export default function FloatingActionMenu() {
  const navigate = useNavigate();
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!isAuthenticated) return null;

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-50 flex items-center justify-center">
      {/* Sub-bubbles */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Messaging Bubble */}
            <motion.button
              initial={{ opacity: 0, scale: 0.96, x: 0, y: -52 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: 0,
                y: -76,
                transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
                x: 0,
                y: -52,
                transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
              }}
              whileHover={{
                scale: 1.08,
                rotate: -6,
                borderColor: 'rgba(255, 255, 255, 1)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.55)',
              }}
              onClick={() => {
                navigate('/messages');
                setIsOpen(false);
              }}
              className="absolute w-[60px] h-[60px] rounded-full bg-[#0d0d0d] border border-white/15 text-white flex items-center justify-center cursor-pointer transition-colors duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
              title="Sohbet"
            >
              <MessageSquare className="w-6 h-6 text-white" strokeWidth={1.8} />
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* Main "+" Action Button */}
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{
          scale: 1.08,
          rotate: isOpen ? 0 : 6,
          borderColor: 'rgba(255, 255, 255, 1)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.55)',
        }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-[60px] h-[60px] rounded-full bg-[#0d0d0d] border border-white/15 text-white flex items-center justify-center cursor-pointer relative active:scale-95 z-10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-colors duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center"
        >
          <Plus className="w-7 h-7 text-[#ff7a00]" strokeWidth={1.8} />
        </motion.div>
      </motion.button>
    </div>
  );
}
