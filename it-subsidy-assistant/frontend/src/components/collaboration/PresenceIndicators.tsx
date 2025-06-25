import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  id: string;
  name: string;
  email: string;
  color: string;
  cursor?: { x: number; y: number };
  activeElement?: string;
}

interface PresenceIndicatorsProps {
  users: User[];
  maxDisplay?: number;
}

export const PresenceIndicators: React.FC<PresenceIndicatorsProps> = ({ 
  users, 
  maxDisplay = 5 
}) => {
  const displayUsers = users.slice(0, maxDisplay);
  const remainingCount = Math.max(0, users.length - maxDisplay);

  return (
    <div className="flex items-center -space-x-2">
      <AnimatePresence>
        {displayUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ scale: 0, x: -20 }}
            animate={{ scale: 1, x: 0 }}
            exit={{ scale: 0, x: 20 }}
            transition={{ 
              delay: index * 0.05,
              type: "spring",
              stiffness: 500,
              damping: 25
            }}
            className="relative group"
          >
            <div
              className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white font-medium text-sm cursor-pointer hover:z-10 transform hover:scale-110 transition-transform"
              style={{ backgroundColor: user.color }}
              title={user.name}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {user.name}
              {user.activeElement && (
                <div className="text-gray-300 text-xs">編集中</div>
              )}
            </div>

            {/* Active indicator */}
            {user.activeElement && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {remainingCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-gray-600 font-medium text-sm"
        >
          +{remainingCount}
        </motion.div>
      )}
    </div>
  );
};