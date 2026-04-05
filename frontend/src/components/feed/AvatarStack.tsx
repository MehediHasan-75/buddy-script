'use client';

import { Avatar } from '@/components/ui/Avatar';
import type { LikeUser } from '@/types';

interface AvatarStackProps {
  likers: LikeUser[];
  totalCount: number;
  maxVisible?: number;
  onViewAll?: () => void;
}

export function AvatarStack({
  likers,
  totalCount,
  maxVisible = 3,
  onViewAll,
}: AvatarStackProps) {
  if (totalCount === 0) return null;

  const visibleLikers = likers.slice(0, maxVisible);
  const remainder = totalCount - visibleLikers.length;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: onViewAll ? 'pointer' : 'default',
      }}
      onClick={onViewAll}
    >
      {/* Avatar Stack Container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          height: '32px',
          cursor: onViewAll ? 'pointer' : 'default',
        }}
        onClick={(e) => {
          e.stopPropagation();
          onViewAll?.();
        }}
      >
        {visibleLikers.map((liker, index) => (
          <div
            key={liker.id}
            style={{
              position: 'absolute',
              left: `${index * 20}px`,
              zIndex: visibleLikers.length - index,
            }}
          >
            <Avatar
              avatarUrl={liker.avatarUrl}
              firstName={liker.firstName}
              lastName={liker.lastName}
              size={32}
              style={{
                border: '2px solid white',
                boxShadow: '0 0 0 1px #e0e0e0',
              }}
            />
          </div>
        ))}

        {/* Remainder Badge */}
        {remainder > 0 && (
          <div
            style={{
              position: 'absolute',
              left: `${visibleLikers.length * 20}px`,
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#1890FF',
              border: '2px solid white',
              boxShadow: '0 0 0 1px #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
              zIndex: 0,
              cursor: onViewAll ? 'pointer' : 'default',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onViewAll?.();
            }}
            role={onViewAll ? 'button' : undefined}
            tabIndex={onViewAll ? 0 : undefined}
          >
            +{remainder}
          </div>
        )}
      </div>

      {/* Like Count Text */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewAll?.();
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: onViewAll ? 'pointer' : 'default',
          color: '#666',
          fontSize: '13px',
          padding: 0,
          fontWeight: 500,
        }}
      >
        {totalCount} like{totalCount !== 1 ? 's' : ''}
      </button>
    </div>
  );
}
