import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SentRequest } from './types';
import { connectionService } from './connectionService';
import { useToast } from '../../contexts/toast/toastContext';
import type { AxiosError } from 'axios';

interface SentRequestsListProps {
  sentRequests: SentRequest[];
  isLoading?: boolean;
  onRefresh?: () => void; // Optional callback to refresh data after withdraw
}

const getInitials = (first?: string, last?: string, username?: string) => {
  if (first || last) {
    return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || 'U';
  }
  if (username) return (username[0] || 'U').toUpperCase();
  return 'U';
};

export const SentRequestsList: React.FC<SentRequestsListProps> = ({
  sentRequests,
  isLoading = false,
  onRefresh,
}) => {
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="w-8 h-8 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
        <p className="mt-2 text-gray-500">Loading sent requests...</p>
      </div>
    );
  }

  if (!sentRequests || sentRequests.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="mb-2 text-gray-400">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </div>
        <h3 className="mb-1 text-lg font-medium text-gray-900">No sent requests</h3>
        <p className="text-gray-500">You haven't sent any connection requests yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sentRequests.map((request) => (
        <SentRequestCard key={request._id} request={request} onRefresh={onRefresh} />
      ))}
    </div>
  );
};

interface SentRequestCardProps {
  request: SentRequest;
  onRefresh?: () => void;
}

const SentRequestCard: React.FC<SentRequestCardProps> = ({ request, onRefresh }) => {
  const navigate = useNavigate();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const toast = useToast() as
    | {
        error?: (msg: string) => void;
        add?: (opts: { type: string; title?: string; message: string }) => void;
        show?: (opts: { type: string; message: string }) => void;
      }
    | ((msg: string) => void)
    | undefined;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const recipient = request.recipient || ({} as Partial<SentRequest['recipient']>);
  const profile =
    Array.isArray(recipient.profileIds) && recipient.profileIds.length > 0
      ? recipient.profileIds[0]
      : null;
  const username = profile?.username ?? recipient.firstName ?? '';
  const firstName = recipient.firstName ?? '';
  const lastName = recipient.lastName ?? '';
  const fullName = `${firstName} ${lastName}`.trim() || username || 'User';
  const initials = getInitials(firstName, lastName, username);
  const imgPlaceholder = `https://placehold.co/800/white/black?text=${encodeURIComponent(initials)}&font=roboto`;
  const photoSrc = recipient.photo || imgPlaceholder;

  const performWithdraw = async () => {
    setIsWithdrawing(true);
    try {
      await connectionService.withdrawConnection(request.recipient._id);
      onRefresh?.();
      setConfirmOpen(false);
    } catch (error) {
      console.error('Error withdrawing connection:', error);
      let errMsg = 'Failed to withdraw connection. Please try again.';
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as AxiosError<{ message?: string }>).response === 'object' &&
        (error as AxiosError<{ message?: string }>).response?.data?.message
      ) {
        errMsg =
          (error as AxiosError<{ message?: string }>).response?.data?.message ??
          'Failed to withdraw connection. Please try again.';
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message?: string }).message === 'string'
      ) {
        errMsg = (error as { message: string }).message;
      }

      if (toast) {
        if (typeof toast === 'function') {
          toast(errMsg);
        } else if (toast.error) {
          toast.error(errMsg);
        } else if (toast.add) {
          toast.add({ type: 'error', title: 'Error', message: errMsg });
        } else if (toast.show) {
          toast.show({ type: 'error', message: errMsg });
        } else {
          alert(errMsg);
        }
      } else {
        alert(errMsg);
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleWithdrawClick = () => {
    setConfirmOpen(true);
  };

  const handleNameClick = () => {
    if (username) {
      navigate(`/user/${username}`);
    } else {
      console.warn('No username available for recipient', recipient._id || recipient);
    }
  };

  return (
    <>
      <div className="relative flex flex-col justify-between p-3 space-y-3 transition-colors border border-gray-200 rounded-lg sm:flex-row sm:items-center sm:p-4 hover:bg-gray-50 sm:space-y-0">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <img
            src={photoSrc}
            alt={fullName}
            className="flex-shrink-0 object-cover w-10 h-10 border-2 border-gray-200 rounded-full sm:w-12 sm:h-12"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== imgPlaceholder) target.src = imgPlaceholder;
            }}
          />
          <div className="flex-1 min-w-0">
            <h4
              className="text-sm font-medium text-gray-900 truncate cursor-pointer sm:text-base hover:text-blue-600"
              onClick={handleNameClick}
            >
              {fullName}
            </h4>

            {request.message ? (
              <p className="mt-1 text-xs italic text-gray-500 sm:text-sm line-clamp-2">
                "
                {request.message.length > 50
                  ? `${request.message.substring(0, 50)}...`
                  : request.message}
                "
              </p>
            ) : null}

            <p className="mt-1 text-xs text-gray-400">
              Sent on{' '}
              {request.createdAt
                ? new Date(request.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : 'Unknown date'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end flex-shrink-0 space-x-2 sm:space-x-2">
          <button
            onClick={handleWithdrawClick}
            disabled={isWithdrawing}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 text-gray-700 text-xs sm:text-sm font-medium rounded-md transition-colors ${
              isWithdrawing
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-50 hover:border-gray-700'
            }`}
          >
            {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
          </button>
        </div>
      </div>

      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`withdraw-confirm-title-${request._id}`}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
        >
          <div className="fixed inset-0 bg-black/40" onClick={() => setConfirmOpen(false)} />

          <div className="relative z-10 w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h3
              id={`withdraw-confirm-title-${request._id}`}
              className="text-lg font-medium text-gray-900"
            >
              Confirm withdraw
            </h3>

            <p className="mt-3 text-sm text-gray-600">
              Withdrawing this request will prevent <strong>{fullName}</strong>{' '}
              {username ? `(@${username}) ` : ''}
              from sending you a new connection request. Are you sure you want to withdraw the
              request?
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md shadow-sm hover:bg-gray-50"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={performWithdraw}
                disabled={isWithdrawing}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm ${
                  isWithdrawing ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isWithdrawing ? 'Withdrawing...' : 'Withdraw request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
