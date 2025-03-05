import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

// Initialize SweetAlert with React content
const MySwal = withReactContent(Swal);

// Base alert configuration
const baseConfig = {
  customClass: {
    container: 'font-body',
    popup: 'rounded-lg shadow-xl border border-earth-700',
    title: 'text-xl font-display font-bold',
    htmlContainer: 'text-gray-700',
    confirmButton: 'px-6 py-2 rounded-lg text-white transition-colors duration-300',
    cancelButton: 'px-6 py-2 rounded-lg transition-colors duration-300'
  },
  buttonsStyling: false,
  backdrop: 'rgba(0, 0, 0, 0.7)',
  showClass: {
    popup: 'animate__animated animate__fadeIn animate__faster'
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOut animate__faster'
  }
};

// Create a safe alert function that checks DOM readiness
const createSafeAlert = () => {
  return (options: any): Promise<any> => {
    return new Promise((resolve) => {
      // Function to show the alert
      const showAlert = () => {
        try {
          resolve(MySwal.fire({
            ...baseConfig,
            ...options
          }));
        } catch (error) {
          console.error('Error showing alert:', error);
          resolve(undefined);
        }
      };

      // Check if document is ready
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        showAlert();
      } else {
        document.addEventListener('DOMContentLoaded', showAlert);
      }
    });
  };
};

// Export the safe alert function
export const showAlert = createSafeAlert();

// Success alert
export const showSuccess = (title: string, text?: string) => {
  return showAlert({
    title,
    text,
    icon: 'success',
    confirmButtonText: 'OK',
    customClass: {
      ...baseConfig.customClass,
      confirmButton: `${baseConfig.customClass.confirmButton} bg-accent-sage hover:bg-accent-moss`,
      title: `${baseConfig.customClass.title} text-accent-sage`
    }
  });
};

// Error alert
export const showError = (title: string, text?: string) => {
  return showAlert({
    title,
    text,
    icon: 'error',
    confirmButtonText: 'OK',
    customClass: {
      ...baseConfig.customClass,
      confirmButton: `${baseConfig.customClass.confirmButton} bg-accent-rust hover:bg-red-700`,
      title: `${baseConfig.customClass.title} text-accent-rust`
    }
  });
};

// Confirmation alert
export const showConfirm = (title: string, text: string) => {
  return showAlert({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'Cancel',
    customClass: {
      ...baseConfig.customClass,
      confirmButton: `${baseConfig.customClass.confirmButton} bg-accent-clay hover:bg-accent-rust`,
      cancelButton: `${baseConfig.customClass.cancelButton} bg-earth-700 hover:bg-earth-600 text-gray-900`,
      title: `${baseConfig.customClass.title} text-accent-clay`
    }
  });
};