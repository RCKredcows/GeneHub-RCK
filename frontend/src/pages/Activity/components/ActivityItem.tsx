import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiExternalLink } from 'react-icons/fi';
import { IconType } from 'react-icons';

const ACTION_ICONS: Record<string, IconType> = {
  create: FiPlus,
  update: FiEdit2,
  delete: FiTrash2
};

const ACTION_COLORS: Record<string, string> = {
  create: 'activity-item--create',
  update: 'activity-item--update',
  delete: 'activity-item--delete'
};

interface ActivityMetadata {
  change?: string;
  amount?: number;
  delta?: number;
  reason?: string;
  [key: string]: unknown;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'Just now';
  }
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

function formatMetadata(metadata: ActivityMetadata | null): string | null {
  if (!metadata) return null;

  // Nitrogen fill/adjustment
  if (metadata.change && metadata.amount !== undefined) {
    const sign = metadata.change === 'filled' ? '+' : '-';
    return `(${sign}${metadata.amount})`;
  }

  // Quantity change
  if (metadata.change && metadata.delta !== undefined) {
    const sign = metadata.delta > 0 ? '+' : '';
    return `(${sign}${metadata.delta})`;
  }

  // Deletion reason
  if (metadata.reason) {
    return `(${metadata.reason})`;
  }

  return null;
}

interface ActivityData {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  created_at: string | null;
  metadata?: ActivityMetadata | unknown;
  user?: { full_name?: string | null; id?: string } | null;
  [key: string]: unknown;
}

interface ActivityItemProps {
  activity: ActivityData;
  getEntityLink: (entityType: string, entityId: string) => string | null;
  formatActionLabel: (actionType: string, entityType: string) => string;
}

export default function ActivityItem({ activity, getEntityLink, formatActionLabel }: ActivityItemProps) {
  const Icon = ACTION_ICONS[activity.action_type] || FiEdit2;
  const colorClass = ACTION_COLORS[activity.action_type] || '';
  const entityLink = getEntityLink(activity.entity_type, activity.entity_id);
  const metadataText = formatMetadata((activity.metadata as ActivityMetadata) || null);

  return (
    <div className={`activity-item ${colorClass}`}>
      <div className="activity-item__icon">
        <Icon size={18} />
      </div>

      <div className="activity-item__content">
        <p className="activity-item__description">
          <strong>{activity.user?.full_name || 'Unknown User'}</strong>
          {' '}
          {formatActionLabel(activity.action_type, activity.entity_type)}
          {' '}
          <span className="activity-item__entity-name">
            &quot;{activity.entity_name}&quot;
          </span>
          {metadataText && (
            <span className="activity-item__metadata">
              {' '}{metadataText}
            </span>
          )}
        </p>

        <span className="activity-item__time">
          {activity.created_at ? formatTime(activity.created_at) : ''}
        </span>
      </div>

      {entityLink && activity.action_type !== 'delete' && (
        <Link
          to={entityLink}
          className="activity-item__link"
          title="View record"
        >
          <FiExternalLink size={16} />
        </Link>
      )}
    </div>
  );
}
