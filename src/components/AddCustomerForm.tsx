import React, { useState } from 'react';
import { X, Save, User, Building, Mail, Phone, MapPin, Globe, Briefcase, Upload, Image } from 'lucide-react';

interface AddCustomerFormProps {
  onSubmit: (customerData: CustomerFormData, customerId?: number) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  initialData?: CustomerFormData;
  isEditing?: boolean;
}

export interface CustomerFormData {
  customer_name: string;
  customer_company_name: string;
  customer_branch: string;
  customer_contact_person: string;
  contact_email: string;
  customer_contact_phone: string;
  customer_adress: string;
  customer_website: string;
  logoFile?: File | null;
}

export const AddCustomerForm: React.FC<AddCustomerFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting,
  initialData,
  isEditing = false
}) => {
  const [formData, setFormData] = useState<CustomerFormData>(initialData || {
    customer_name: '',
    customer_company_name: '',
    customer_branch: '',
    customer_contact_person: '',
    contact_email: '',
    customer_contact_phone: '',
    customer_adress: '',
    customer_website: '',
    logoFile: null
  });

  const [errors, setErrors] = useState<Partial<CustomerFormData>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Set logo preview if editing and customer has existing logo
  React.useEffect(() => {
    if (isEditing && initialData && !logoPreview) {
      // If editing and there's existing logo data, we could set a preview here
      // For now, we'll just clear the preview when switching between add/edit modes
      setLogoPreview(null);
    }
  }, [isEditing, initialData, logoPreview]);

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, logoFile: file }));
    
    // Create preview URL
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  };
  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerFormData> = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Kundenname ist erforderlich';
    }

    if (!formData.customer_company_name.trim()) {
      newErrors.customer_company_name = 'Firmenname ist erforderlich';
    }

    if (!formData.customer_contact_person.trim()) {
      newErrors.customer_contact_person = 'Ansprechpartner ist erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'transparent' }}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'white' }}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200" style={{ backgroundColor: 'white' }}>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {isEditing ? 'Kunde bearbeiten' : 'Neuen Kunden hinzufügen'}
                </h2>
                <p className="text-sm text-gray-600">
                  {isEditing ? 'Bearbeiten Sie die Kundendaten' : 'Geben Sie die Kundendaten ein'}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6" style={{ backgroundColor: 'white' }}>
            {/* Row 1: Customer Name & Company Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Kundenname *
                </label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => handleInputChange('customer_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.customer_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="z.B. Max Mustermann"
                  disabled={isSubmitting}
                />
                {errors.customer_name && (
                  <p className="text-red-600 text-xs mt-1">{errors.customer_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="w-4 h-4 inline mr-1" />
                  Firmenname *
                </label>
                <input
                  type="text"
                  value={formData.customer_company_name}
                  onChange={(e) => handleInputChange('customer_company_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.customer_company_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="z.B. Mustermann GmbH"
                  disabled={isSubmitting}
                />
                {errors.customer_company_name && (
                  <p className="text-red-600 text-xs mt-1">{errors.customer_company_name}</p>
                )}
              </div>
            </div>

            {/* Row 2: Branch & Contact Person */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-1" />
                  Branche
                </label>
                <input
                  type="text"
                  value={formData.customer_branch}
                  onChange={(e) => handleInputChange('customer_branch', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. Elektrotechnik"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Ansprechpartner *
                </label>
                <input
                  type="text"
                  value={formData.customer_contact_person}
                  onChange={(e) => handleInputChange('customer_contact_person', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.customer_contact_person ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="z.B. Anna Schmidt"
                  disabled={isSubmitting}
                />
                {errors.customer_contact_person && (
                  <p className="text-red-600 text-xs mt-1">{errors.customer_contact_person}</p>
                )}
              </div>
            </div>

            {/* Row 3: Email & Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  E-Mail
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.contact_email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="z.B. kontakt@mustermann.de"
                  disabled={isSubmitting}
                />
                {errors.contact_email && (
                  <p className="text-red-600 text-xs mt-1">{errors.contact_email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telefonnummer
                </label>
                <input
                  type="tel"
                  value={formData.customer_contact_phone}
                  onChange={(e) => handleInputChange('customer_contact_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. +49 123 456789"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Row 4: Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Adresse
              </label>
              <input
                type="text"
                value={formData.customer_adress}
                onChange={(e) => handleInputChange('customer_adress', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="z.B. Musterstraße 123, 12345 Musterstadt"
                disabled={isSubmitting}
              />
            </div>

            {/* Row 5: Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 inline mr-1" />
                Website
              </label>
              <input
                type="url"
                value={formData.customer_website}
                onChange={(e) => handleInputChange('customer_website', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.customer_website ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="z.B. www.mustermann.de"
                disabled={isSubmitting}
              />
            </div>

            {/* Row 6: Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Image className="w-4 h-4 inline mr-1" />
                Logo
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Unterstützte Formate: JPG, PNG, GIF (max. 5MB)
                  </p>
                </div>
                {logoPreview && (
                  <div className="flex-shrink-0">
                    <img
                      src={logoPreview}
                      alt="Logo Vorschau"
                      className="w-16 h-16 object-cover rounded-lg border border-gray-300"
                    />
                  </div>
                )}
              </div>
            </div>
            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200" style={{ backgroundColor: 'white' }}>
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-blue-400"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>
                  {isSubmitting 
                    ? (isEditing ? 'Aktualisieren...' : 'Speichern...') 
                    : (isEditing ? 'Aktualisieren' : 'Speichern')
                  }
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};