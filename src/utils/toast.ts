import Swal from 'sweetalert2';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

const toast = ({
  type,
  title,
  message,
  duration = 3000
}: ToastOptions): void => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: duration,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  const iconMap: Record<ToastType, any> = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };

  Toast.fire({
    icon: iconMap[type],
    title: `<span class="font-medium">${title}</span>`,
    html: `<span class="text-sm">${message}</span>`,
    customClass: {
      popup: 'rounded-lg shadow-lg',
      title: 'text-base font-semibold',
      timerProgressBar: `bg-${type === 'error' ? 'red' : type === 'success' ? 'green' : type === 'warning' ? 'yellow' : 'blue'}-400`
    }
  });
};

export default toast;
