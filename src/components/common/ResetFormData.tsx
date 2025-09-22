import { useAutoSave } from '../../contexts/AutoSaveContext';
import { useToast } from '../../contexts/toast/toastContext';
import { Button } from '../ui/button';
import { StartupRegisterFormData } from '../../types/company';

type ResetFormButtonProps = {
  setFormData: (data: StartupRegisterFormData) => void;
  initialFormData: StartupRegisterFormData;
  onReset?: () => void; // Optional callback for additional reset operations
};

export const ResetFormButton = ({
  setFormData,
  initialFormData,
  onReset,
}: ResetFormButtonProps) => {
  const { resetSavedData } = useAutoSave();
  const toast = useToast();

  const handleReset = () => {
    resetSavedData();
    setFormData(initialFormData);
    onReset?.(); // Call optional reset callback
    toast.open({
      message: {
        heading: 'Form Reset',
        content: 'Form has been successfully reset to initial values.',
      },
      duration: 3000,
      position: 'top-center',
      color: 'success',
    });
  };

  return (
    <Button type="button" className="bg-blue-300 cursor-pointer" onClick={handleReset}>
      Reset Form
    </Button>
  );
};
