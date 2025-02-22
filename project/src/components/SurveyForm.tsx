import React, { useState } from 'react';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { NostrService } from '../lib/nostr';

interface SurveyFormProps {
  nostrService: NostrService;
  onSubmit?: () => void;
}

export function SurveyForm({ nostrService, onSubmit }: SurveyFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    isLocal: 'local',
    bitcoinKnowledge: '0',
    financialEducation: '5',
    hasBitcoin: 'no',
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const timestamp = new Date().toISOString();
      const interviewer = nostrService.getCurrentUser()?.npub;

      const surveyData = {
        ...formData,
        timestamp,
        interviewer,
      };

      // Publish to Nostr
      const nostrEvent = await nostrService.publishSurveyData(surveyData);
      
      if (!nostrEvent) {
        throw new Error('Failed to publish to Nostr');
      }

      // Reset form
      setFormData({
        isLocal: 'local',
        bitcoinKnowledge: '0',
        financialEducation: '5',
        hasBitcoin: 'no',
        name: '',
      });

      onSubmit?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardCheck className="w-6 h-6 text-orange-500" />
        <h2 className="text-xl font-semibold">New Survey Response</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Respondent's First Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
        </div>

        <div>
          <label htmlFor="isLocal" className="block text-sm font-medium text-gray-700 mb-1">
            Tourist or Local?
          </label>
          <select
            id="isLocal"
            name="isLocal"
            value={formData.isLocal}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="local">Local</option>
            <option value="tourist">Tourist</option>
          </select>
        </div>

        <div>
          <label htmlFor="bitcoinKnowledge" className="block text-sm font-medium text-gray-700 mb-1">
            Bitcoin Knowledge (0-10)
          </label>
          <input
            type="number"
            id="bitcoinKnowledge"
            name="bitcoinKnowledge"
            min="0"
            max="10"
            value={formData.bitcoinKnowledge}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
        </div>

        <div>
          <label htmlFor="financialEducation" className="block text-sm font-medium text-gray-700 mb-1">
            Importance of Financial Education (0-10)
          </label>
          <input
            type="number"
            id="financialEducation"
            name="financialEducation"
            min="0"
            max="10"
            value={formData.financialEducation}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
        </div>

        <div>
          <label htmlFor="hasBitcoin" className="block text-sm font-medium text-gray-700 mb-1">
            Has Bitcoin?
          </label>
          <select
            id="hasBitcoin"
            name="hasBitcoin"
            value={formData.hasBitcoin}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Survey'
          )}
        </button>

        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </div>
    </form>
  );
}