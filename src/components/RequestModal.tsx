import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { RequestType } from '../types/requests';
import { createTradeRequest, createProjectRequest } from '../lib/requests';
import toast from '../utils/toast';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  recipientId: string;
  type: RequestType;
}

interface TradeModalProps extends BaseModalProps {
  mode: 'trade';
  tradeId: string;
  tradeName: string;
}

interface ProjectModalProps extends BaseModalProps {
  mode: 'project';
  projectId: string;
  projectName: string;
  positionId: string;
  positionName: string;
  requiredSkills?: string[];
}

type RequestModalProps = TradeModalProps | ProjectModalProps;

export default function RequestModal(props: RequestModalProps) {
  const [message, setMessage] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [proposedSkills, setProposedSkills] = useState<string[]>([]);

  const validateForm = () => {
    if (props.mode === 'project' && props.requiredSkills?.length && !proposedSkills.length) {
      setError('Please select at least one relevant skill');
      return false;
    }

    if (expiryDate) {
      const expiry = new Date(expiryDate);
      const now = new Date();
      if (expiry <= now) {
        setError('Expiry date must be in the future');
        return false;
      }
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (props.mode === 'trade') {
        await createTradeRequest(
          props.currentUserId,
          props.recipientId,
          props.tradeId,
          props.tradeName,
          props.type,
          message,
          expiryDate ? new Date(expiryDate) : undefined
        );
      } else {
        await createProjectRequest(
          props.currentUserId,
          props.recipientId,
          props.projectId,
          props.projectName,
          props.positionId,
          props.positionName,
          props.type,
          props.requiredSkills,
          proposedSkills,
          message,
          expiryDate ? new Date(expiryDate) : undefined
        );
      }

      toast({
        type: 'success',
        title: 'Request sent successfully',
        message: `Your ${props.mode} request has been sent to the recipient`
      });

      props.onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send request';
      setError(errorMessage);
      toast({
        type: 'error',
        title: 'Error sending request',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  if (!props.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {props.type === 'invitation' ? 'Send Invitation' : 'Submit Request'}
          </h2>
          <button
            onClick={props.onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {props.mode === 'trade' ? props.tradeName : props.projectName}
            </label>
            {props.mode === 'project' && (
              <p className="text-sm text-gray-500 mb-2">
                Position: {props.positionName}
              </p>
            )}
          </div>

          {props.mode === 'project' && props.requiredSkills && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Skills
              </label>
              <div className="flex flex-wrap gap-2 mb-4">
                {props.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Relevant Skills <span className="text-red-500">*</span>
              </label>
              <select
                multiple
                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  error && !proposedSkills.length
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                value={proposedSkills}
                onChange={(e) => setProposedSkills(Array.from(e.target.selectedOptions, option => option.value))}
              >
                {props.requiredSkills.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Hold Ctrl/Cmd to select multiple skills
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Add a personal message..."
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expires On (Optional)
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                error && expiryDate && new Date(expiryDate) <= new Date()
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={props.onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                loading ? 'animate-pulse' : ''
              }`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </span>
              ) : (
                'Send Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
