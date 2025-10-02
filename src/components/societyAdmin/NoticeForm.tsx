'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Calendar,
  Clock,
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  Users,
  Building,
  Home,
  Send,
  Save,
  ArrowLeft,
} from 'lucide-react';
import { createNotice, updateNotice, getAudienceOptions } from '@/lib/apiClient';

interface Attachment {
  type: string;
  url: string;
  name: string;
}

interface NoticeFormProps {
  societyId: string;
  editMode?: boolean;
  noticeId?: string;
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const NoticeForm = ({ 
  societyId, 
  editMode = false, 
  noticeId, 
  initialData, 
  onSuccess, 
  onCancel 
}: NoticeFormProps) => {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [audienceType, setAudienceType] = useState('All Residents');
  const [selectedWings, setSelectedWings] = useState<string[]>([]);
  const [selectedFlats, setSelectedFlats] = useState<string[]>([]);
  const [sendPushNotification, setSendPushNotification] = useState(true);
  const [sendEmailNotification, setSendEmailNotification] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [audienceOptions, setAudienceOptions] = useState<any>({
    types: ['All Residents', 'Specific Wing(s)', 'Specific Flat(s)'],
    wings: [],
    flats: []
  });

  // Load audience options and initial data if in edit mode
  useEffect(() => {
    const fetchAudienceOptions = async () => {
      try {
        const response = await getAudienceOptions();
        if (response.success) {
          setAudienceOptions(response.options);
        }
      } catch (error) {
        console.error('Failed to fetch audience options:', error);
      }
    };

    fetchAudienceOptions();

    if (editMode && initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setCategory(initialData.category || 'General');
      setAudienceType(initialData.audience_type || 'All Residents');
      
      if (initialData.firestoreData?.audience) {
        if (initialData.firestoreData.audience.wings) {
          setSelectedWings(initialData.firestoreData.audience.wings);
        }
        if (initialData.firestoreData.audience.flats) {
          setSelectedFlats(initialData.firestoreData.audience.flats);
        }
      }
      
      setSendPushNotification(initialData.send_push_notification === 1);
      setSendEmailNotification(initialData.send_email_notification === 1);
      
      // Use attachments from MySQL database as primary source, Firestore as fallback
      let attachmentsData: Attachment[] = [];
      if (initialData.attachments && initialData.attachments.length > 0) {
        attachmentsData = initialData.attachments;
      } else if (initialData.firestoreData?.attachments) {
        attachmentsData = initialData.firestoreData.attachments;
      }

      // Sanitize attachments to ensure they have required properties
      const validAttachments = attachmentsData.filter(
        (attachment): attachment is Attachment => 
          !!(attachment && typeof attachment.type === 'string' && attachment.url && attachment.name)
      ).map(attachment => ({
        ...attachment,
        type: attachment.type || 'application/octet-stream', // Fallback if type is empty string
      }));

      setExistingAttachments(validAttachments);
      console.log('Sanitized existingAttachments:', validAttachments);
    }
  }, [editMode, initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
      
      // Create previews for images
      newFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              setAttachmentPreviews(prev => [...prev, e.target!.result as string]);
            }
          };
          reader.readAsDataURL(file);
        } else {
          // For non-image files, use a placeholder
          setAttachmentPreviews(prev => [...prev, 'file']);
        }
      });
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setAttachmentPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (index: number) => {
    setExistingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!category) {
      setError('Category is required');
      return false;
    }
    if (audienceType === 'Specific Wing(s)' && selectedWings.length === 0) {
      setError('Please select at least one wing');
      return false;
    }
    if (audienceType === 'Specific Flat(s)' && selectedFlats.length === 0) {
      setError('Please select at least one flat');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('audience_type', audienceType);
      
      if (audienceType === 'Specific Wing(s)') {
        selectedWings.forEach(wing => {
          formData.append('selected_wing_ids[]', wing);
        });
      }
      
      if (audienceType === 'Specific Flat(s)') {
        selectedFlats.forEach(flat => {
          formData.append('selected_flat_ids[]', flat);
        });
      }
      
      formData.append('send_push_notification', sendPushNotification ? '1' : '0');
      formData.append('send_email_notification', sendEmailNotification ? '1' : '0');
      
      // Add existing attachments
      if (existingAttachments.length > 0) {
        formData.append('existing_attachments', JSON.stringify(existingAttachments));
      }
      
      // Add new attachments
      attachments.forEach(file => {
        formData.append('attachments[]', file);
      });
      
      let response;
      if (editMode && noticeId) {
        response = await updateNotice(noticeId, formData);
      } else {
        response = await createNotice(formData);
      }
      
      if (response.success) {
        setSuccess(editMode ? 'Notice updated successfully!' : 'Notice created successfully!');
        
        // Reset form if not in edit mode
        if (!editMode) {
          setTitle('');
          setDescription('');
          setCategory('General');
          setAudienceType('All Residents');
          setSelectedWings([]);
          setSelectedFlats([]);
          setSendPushNotification(true);
          setSendEmailNotification(false);
          setAttachments([]);
          setAttachmentPreviews([]);
        }
        
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else {
        setError(response.error || 'Failed to save notice');
      }
    } catch (error: any) {
      console.error('Error saving notice:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const navigateBack = () => {
    if (onCancel) {
      onCancel();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {editMode ? 'Edit Notice' : 'Create Notice'}
          </h1>
          <p className="text-gray-600 mt-1">
            {editMode ? 'Update notice details' : 'Create a new notice for your society'}
          </p>
        </div>
        <button
          onClick={navigateBack}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* Error and Success Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Title and Description */}
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter notice title"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[150px]"
              placeholder="Enter notice description"
              required
            />
          </div>
        </div>

        {/* Category and Audience */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="General">General</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Emergency">Emergency</option>
              <option value="Events">Events</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="audienceType" className="block text-sm font-medium text-gray-700 mb-1">
              Audience <span className="text-red-500">*</span>
            </label>
            <select
              id="audienceType"
              value={audienceType}
              onChange={(e) => setAudienceType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {audienceOptions.types.map((type: string) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Wing/Flat Selection (conditional) */}
        {audienceType === 'Specific Wing(s)' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Wings <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {audienceOptions.wings.map((wing: any) => (
                <label key={wing.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedWings.includes(wing.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedWings([...selectedWings, wing.id]);
                      } else {
                        setSelectedWings(selectedWings.filter(id => id !== wing.id));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span>{wing.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {audienceType === 'Specific Flat(s)' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Flats <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-2">
              {audienceOptions.flats.map((flat: any) => (
                <label key={flat.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedFlats.includes(flat.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFlats([...selectedFlats, flat.id]);
                      } else {
                        setSelectedFlats(selectedFlats.filter(id => id !== flat.id));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span>{flat.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Notification Options */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-800">Notification Options</h3>
          
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="sendPushNotification"
              checked={sendPushNotification}
              onChange={(e) => setSendPushNotification(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="sendPushNotification" className="text-sm font-medium text-gray-700">
              Send push notification to recipients
            </label>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="sendEmailNotification"
              checked={sendEmailNotification}
              onChange={(e) => setSendEmailNotification(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="sendEmailNotification" className="text-sm font-medium text-gray-700">
              Send email notification to recipients
            </label>
          </div>
        </div>

        {/* Attachments */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-800">Attachments</h3>
          
          <div className="flex items-center space-x-3">
            <label htmlFor="attachments" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Add Files</span>
              <input
                type="file"
                id="attachments"
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
            </label>
            <p className="text-sm text-gray-500">Upload images, documents, or other files</p>
          </div>
          
          {/* Attachment Previews */}
          {(attachmentPreviews.length > 0 || existingAttachments.length > 0) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {/* New attachments */}
              {attachmentPreviews.map((preview, index) => (
                <div key={`new-${index}`} className="relative border rounded-lg p-2 flex flex-col items-center">
                  {preview === 'file' ? (
                    <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                      <span className="text-sm text-gray-500">{attachments[index].name}</span>
                    </div>
                  ) : (
                    <img src={preview} alt="Preview" className="w-full h-24 object-cover rounded" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="absolute top-1 right-1 p-1 bg-red-100 rounded-full text-red-500 hover:bg-red-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {/* Existing attachments */}
              {existingAttachments.map((attachment, index) => (
                <div key={`existing-${index}`} className="relative border rounded-lg p-2 flex flex-col items-center">
                  {attachment.type.startsWith('image/') ? (
                    <img src={attachment.url} alt="Attachment" className="w-full h-24 object-cover rounded" />
                  ) : (
                    <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                      <span className="text-sm text-gray-500">{attachment.name || 'Unknown File'}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeExistingAttachment(index)}
                    className="absolute top-1 right-1 p-1 bg-red-100 rounded-full text-red-500 hover:bg-red-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={navigateBack}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="animate-spin">
                  <Clock className="w-4 h-4" />
                </span>
                <span>{editMode ? 'Updating...' : 'Creating...'}</span>
              </>
            ) : (
              <>
                {editMode ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Update Notice</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Create Notice</span>
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NoticeForm;