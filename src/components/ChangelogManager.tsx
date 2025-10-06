import React, { useState, useEffect } from 'react';
import { Plus, Check, X, FileText, CreditCard as Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ChangelogEntry {
  id: string;
  customer_id: number;
  campaign_id?: string | null;
  title: string;
  assignee?: string | null;
  completed: boolean;
  created_at: string;
  date_changelog?: string | null;
  description?: string | null;
}

interface ChangelogManagerProps {
  selectedCustomerId: number;
  selectedCampaignIds?: string[];
}

interface Campaign {
  id: string;
  name: string;
}

export const ChangelogManager: React.FC<ChangelogManagerProps> = ({
  selectedCustomerId,
  selectedCampaignIds = []
}) => {
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryDescription, setNewEntryDescription] = useState('');
  const [newEntryDate, setNewEntryDate] = useState('');
  const [newEntryCampaignId, setNewEntryCampaignId] = useState('');
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editEntryTitle, setEditEntryTitle] = useState('');
  const [editEntryDescription, setEditEntryDescription] = useState('');
  const [editEntryDate, setEditEntryDate] = useState('');
  const [editEntryCampaignId, setEditEntryCampaignId] = useState('');
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredEntryId, setHoveredEntryId] = useState<string | null>(null);

  const handleEditEntry = (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (entry) {
      setEditingEntryId(entryId);
      setEditEntryTitle(entry.title);
      setEditEntryDescription(entry.description || '');
      setEditEntryDate(entry.date_changelog ? new Date(entry.date_changelog).toISOString().split('T')[0] : '');
      setEditEntryCampaignId(entry.campaign_id || '');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEntryId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const entryData: any = {
        title: editEntryTitle.trim(),
        description: editEntryDescription.trim(),
        campaign_id: editEntryCampaignId || null
      };

      if (editEntryDate && editEntryDate.trim()) {
        entryData.date_changelog = new Date(editEntryDate).toISOString();
      }

      const { error } = await supabase
        .from('changelog')
        .update(entryData)
        .eq('id', editingEntryId);

      if (error) {
        console.error('Error updating changelog entry:', error);
        setError(error.message);
      } else {
        setEntries(prev => prev.map(e =>
          e.id === editingEntryId
            ? { ...e, title: editEntryTitle.trim(), description: editEntryDescription.trim(), date_changelog: editEntryDate ? new Date(editEntryDate).toISOString() : null, campaign_id: editEntryCampaignId || null }
            : e
        ));
        handleCancelEdit();
      }
    } catch (err) {
      console.error('Exception updating changelog entry:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setEditEntryTitle('');
    setEditEntryDescription('');
    setEditEntryDate('');
    setEditEntryCampaignId('');
  };

  const fetchEntries = async () => {
    if (!selectedCustomerId) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('changelog')
        .select('*')
        .eq('customer_id', selectedCustomerId);

      if (selectedCampaignIds.length > 0) {
        query = query.in('campaign_id', selectedCampaignIds);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching changelog entries:', error);
        setError(error.message);
      } else {
        setEntries(data || []);
      }
    } catch (err) {
      console.error('Exception fetching changelog entries:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    if (!selectedCustomerId) return;

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('customer_id', selectedCustomerId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching campaigns:', error);
      } else {
        setCampaigns(data || []);
      }
    } catch (err) {
      console.error('Exception fetching campaigns:', err);
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchCampaigns();
  }, [selectedCustomerId, selectedCampaignIds]);

  const handleAddEntry = async (title: string, description: string, campaignId: string, changelogDate?: string) => {
    if (!selectedCustomerId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const entryData: any = {
        customer_id: selectedCustomerId,
        title: title.trim(),
        description: description.trim(),
        campaign_id: campaignId || null,
        completed: false
      };

      if (changelogDate && changelogDate.trim()) {
        entryData.date_changelog = new Date(changelogDate).toISOString();
      }

      const { data, error } = await supabase
        .from('changelog')
        .insert([entryData])
        .select()
        .single();

      if (error) {
        console.error('Error adding changelog entry:', error);
        setError(error.message);
      } else {
        setEntries(prev => [data, ...prev]);
      }
    } catch (err) {
      console.error('Exception adding changelog entry:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEntry = async (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    setError(null);

    try {
      const { error } = await supabase
        .from('changelog')
        .update({ completed: !entry.completed })
        .eq('id', id);

      if (error) {
        console.error('Error toggling changelog entry:', error);
        setError(error.message);
      } else {
        setEntries(prev => prev.map(e =>
          e.id === id ? { ...e, completed: !e.completed } : e
        ));
      }
    } catch (err) {
      console.error('Exception toggling changelog entry:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    setError(null);

    try {
      const { error } = await supabase
        .from('changelog')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting changelog entry:', error);
        setError(error.message);
      } else {
        setEntries(prev => prev.filter(e => e.id !== id));
      }
    } catch (err) {
      console.error('Exception deleting changelog entry:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEntryTitle.trim() && newEntryDescription.trim()) {
      handleAddEntry(newEntryTitle.trim(), newEntryDescription.trim(), newEntryCampaignId, newEntryDate);
      setNewEntryTitle('');
      setNewEntryDescription('');
      setNewEntryCampaignId('');
      setNewEntryDate('');
      setIsAddingEntry(false);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('de-DE');
    } catch {
      return dateString;
    }
  };


  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 text-sm">
            <strong>Fehler:</strong> {error}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">Changelog</h3>
        </div>
        <button
          onClick={() => setIsAddingEntry(true)}
          disabled={loading || isSubmitting}
          className="flex items-center space-x-2 border-2 border-primary-blue hover:border-secondary-blue text-primary-blue hover:text-secondary-blue bg-transparent px-4 py-2 rounded-lg transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Neuer Eintrag</span>
        </button>
      </div>

      {isAddingEntry && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={newEntryTitle}
                onChange={(e) => setNewEntryTitle(e.target.value)}
                placeholder="Kurzbeschreibung der Änderungen"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={newEntryCampaignId}
                onChange={(e) => setNewEntryCampaignId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              >
                <option value="">Kampagne wählen (optional)</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={newEntryDescription}
                onChange={(e) => setNewEntryDescription(e.target.value)}
                placeholder="Details"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              />
              <input
                type="date"
                value={newEntryDate}
                onChange={(e) => setNewEntryDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                title="Changelog-Datum (optional)"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors duration-200"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingEntry(false);
                  setNewEntryTitle('');
                  setNewEntryDescription('');
                  setNewEntryCampaignId('');
                  setNewEntryDate('');
                }}
                className="bg-gray-400 hover:bg-gray-500 text-white p-2 rounded-lg transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Lade Changelog...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Keine Einträge für den gewählten Kunden (und die gewählten Kampagnen)</p>
            </div>
          ) : (
            <>
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
                >
                  {editingEntryId === entry.id ? (
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editEntryTitle}
                          onChange={(e) => setEditEntryTitle(e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                          placeholder="Eintragstitel..."
                        />
                        <select
                          value={editEntryCampaignId}
                          onChange={(e) => setEditEntryCampaignId(e.target.value)}
                          className="w-40 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                        >
                          <option value="">Keine Kampagne</option>
                          {campaigns.map(campaign => (
                            <option key={campaign.id} value={campaign.id}>
                              {campaign.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={editEntryDescription}
                          onChange={(e) => setEditEntryDescription(e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                          placeholder="Details"
                        />
                        <input
                          type="date"
                          value={editEntryDate}
                          onChange={(e) => setEditEntryDate(e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                        />
                        <button
                          onClick={handleSaveEdit}
                          disabled={isSubmitting}
                          className="bg-green-600 hover:bg-green-700 text-white p-1 rounded transition-colors duration-200"
                          title="Speichern"
                        >
                          {isSubmitting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-400 hover:bg-gray-500 text-white p-1 rounded transition-colors duration-200"
                          title="Abbrechen"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 relative">
                        <span
                          className="transition-all duration-200 cursor-help text-gray-900"
                          onMouseEnter={() => setHoveredEntryId(entry.id)}
                          onMouseLeave={() => setHoveredEntryId(null)}
                        >
                          {entry.title}
                          {entry.campaign_id && (
                            <span className="text-xs text-gray-500 ml-2">
                              ({campaigns.find(c => c.id === entry.campaign_id)?.name || 'Unbekannte Kampagne'})
                            </span>
                          )}
                        </span>
                        {hoveredEntryId === entry.id && entry.description && (
                          <div className="absolute left-0 top-full mt-1 z-50 border border-gray-300 rounded-lg shadow-lg p-3 min-w-[300px] max-w-[500px]" style={{ backgroundColor: '#ffffff' }}>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{entry.description}</p>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {entry.date_changelog ? formatDate(entry.date_changelog) : formatDate(entry.created_at)}
                      </span>
                      <button
                        onClick={() => handleEditEntry(entry.id)}
                        className="opacity-100 flex-shrink-0 text-blue-400 hover:text-blue-600 p-1 rounded transition-all duration-200"
                        title="Eintrag bearbeiten"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="opacity-100 flex-shrink-0 text-red-400 hover:text-red-600 p-1 rounded transition-all duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};
