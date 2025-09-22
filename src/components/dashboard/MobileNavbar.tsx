import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { MenuIcon } from 'lucide-react';
import { useUnreadMessage } from '../../contexts/UnreadMessageContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function MobileNavbar() {
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);
  const { totalUnreadCount } = useUnreadMessage();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      setVisible(prevScrollPos > currentScrollPos || currentScrollPos < 5);
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

  return (
    <motion.nav
      className="z-[9999] fixed top-0 left-0 right-0 flex items-center justify-between px-4 py-2 shadow-md bg-white"
      initial={{ y: -100 }}
      animate={{ y: visible ? 0 : -100 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ height: 56, zIndex: 9999 }}
    >
      <a href="/">
        <img src="/logo.png" alt="Neecop Logo" className="h-7 w-auto" />
      </a>

      <div className="flex items-center space-x-3">
        {isAuthenticated() ? (
          <div className="relative cursor-pointer" onClick={() => navigate('/dashboard/chat')}>
            <img src="/dashboard/message.png" alt="Messages" className="h-6 w-6 cursor-pointer" />
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1 py-0.5 rounded-full">
                {totalUnreadCount}
              </span>
            )}
          </div>
        ) : (
          <>
            <button
              className="text-sm px-3 py-1 rounded bg-blue-500 text-white font-medium"
              onClick={() => navigate('/auth/signin')}
            >
              Login
            </button>
            <button
              className="text-sm px-3 py-1 rounded bg-gray-200 text-blue-600 font-medium"
              onClick={() => navigate('/auth/signup')}
            >
              Register
            </button>
          </>
        )}
        <Sheet>
          <SheetTrigger>
            <MenuIcon size={24} />
          </SheetTrigger>
          <SheetContent side="top" className="p-3 bg-white">
            <div className="flex flex-col space-y-3">
              <a href="/" className="text-base font-semibold p-1 pb-2 border-b border-gray-200">
                Home
              </a>
              <a
                href="/dashboard/startups"
                className="text-base font-semibold p-1 pb-2 border-b border-gray-200"
              >
                Startups
              </a>
              <a
                href="/dashboard/feed"
                className="text-base font-semibold p-1 pb-2 border-b border-gray-200"
              >
                Dashboard
              </a>
              <a
                href="/dashboard/funds"
                className="text-base font-semibold p-1 pb-2 border-b border-gray-200"
              >
                Funds
              </a>{' '}
              <a
                href="/dashboard/reports"
                className="text-base font-semibold p-1 pb-2 border-b border-gray-200"
              >
                Reports
              </a>{' '}
              <a
                href="/dashboard/knowledge_base"
                className="text-base font-semibold p-1 pb-2 border-b border-gray-200"
              >
                KnowledgeBase
              </a>
              {!isAuthenticated() && (
                <div className="flex space-x-2 pt-2">
                  <button
                    className="flex-1 text-sm px-3 py-1 rounded bg-blue-500 text-white font-medium"
                    onClick={() => navigate('/login')}
                  >
                    Login
                  </button>
                  <button
                    className="flex-1 text-sm px-3 py-1 rounded bg-gray-200 text-blue-600 font-medium"
                    onClick={() => navigate('/register')}
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </motion.nav>
  );
}
