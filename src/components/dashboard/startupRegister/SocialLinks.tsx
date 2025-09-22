import React, { useState, useEffect } from 'react';
import { Plus, Trash, Link as LinkIcon } from 'lucide-react';
import { StartupRegisterFormData } from '../../../types/company';
import { useToast } from '../../../contexts/toast/toastContext';
import { InputField } from '../../../components/common/form-components';
import { Button } from '../../ui/button';

interface SocialLinksProps {
  formData: StartupRegisterFormData;
  setFormData: React.Dispatch<React.SetStateAction<StartupRegisterFormData>>;
  setActiveSection: (section: string) => void;
}

const SocialLinks: React.FC<SocialLinksProps> = ({ formData, setFormData, setActiveSection }) => {
  const [links, setLinks] = useState<string[]>(formData.socialLinks);
  const [newLink, setNewLink] = useState('');
  const toast = useToast();

  // Update local state when formData changes (e.g., on form reset)
  useEffect(() => {
    setLinks(formData.socialLinks);
  }, [formData.socialLinks]);

  // Sync links with formData for autosave
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: links,
    }));
  }, [links, setFormData]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewLink(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      addLink(event);
    }
  };

  const addLink = (event: React.FormEvent | React.KeyboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    if (!newLink.trim()) return;
    if (links.includes(newLink)) {
      toast.open({
        message: {
          heading: 'Already Present',
          content: 'This social link is already added.',
        },
        duration: 5000,
        position: 'top-center',
        color: 'error',
      });
      return;
    }
    setLinks([...links, newLink]);
    setNewLink('');
  };

  const deleteLink = (link: string) => {
    setLinks(links.filter((ele) => ele !== link));
  };

  const saveAndNext = () => {
    // formData.socialLinks is already synced via useEffect
    setActiveSection('media');
  };

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-[#1E5EFF]">Social Links</h2>
        <p className="text-gray-500 text-xs sm:text-sm">
          Connect and manage your social media profiles.
        </p>
      </div>
      <div className="flex flex-col gap-4 justify-center">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2">
          <div className="flex-1 w-full">
            <InputField
              label="Social Link"
              name="newSocialLink"
              value={newLink}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter social media link..."
              icon={<LinkIcon className="w-4 h-4" />}
              className="w-full"
            />
          </div>
          <Button
            onClick={addLink}
            variant="default"
            size="default"
            className="bg-[#1E5EFF] text-white rounded-md hover:bg-[#164acc] transition w-full sm:w-auto h-[42px] flex items-center gap-2"
            type="button"
          >
            <Plus size={16} />
            <span className="text-sm">Add Link</span>
          </Button>
        </div>
        {links.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-500 py-8 sm:py-10 border border-dashed border-gray-300 rounded-md">
            <Plus size={32} className="text-[#1E5EFF]" />
            <p className="text-base sm:text-lg font-medium mt-2">No Social Links Yet</p>
            <p className="text-xs sm:text-sm text-gray-400 text-center w-full">
              Connect your social media profiles to share them with your audience.
            </p>
          </div>
        ) : (
          <ul className="space-y-2 overflow-y-auto max-h-[300px] sm:max-h-[400px]">
            {links.map((link, index) => (
              <li
                key={`social-link-${index}`}
                className="flex justify-between items-center border border-gray-300 p-2 sm:p-3 rounded-md shadow-sm"
              >
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1E5EFF] hover:underline break-all text-sm sm:text-base"
                >
                  {link}
                </a>
                <button
                  type="button"
                  onClick={() => deleteLink(link)}
                  className="text-red-500 hover:text-red-700 transition ml-2"
                  title="Delete social link"
                  aria-label="Delete social link"
                >
                  <Trash size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-auto flex justify-center sm:justify-end pt-4 sm:pt-6">
        <button
          type="button"
          onClick={saveAndNext}
          className="bg-[#1E5EFF] text-white px-4 sm:px-6 py-2 rounded-md hover:bg-[#164acc] transition w-full sm:w-auto"
        >
          Save & Next
        </button>
      </div>
    </div>
  );
};

export default SocialLinks;
