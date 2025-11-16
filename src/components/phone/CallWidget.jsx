import { useEffect } from 'react';
import { createPageUrl } from "@/utils";

export default function CallWidget({ isOpen, onClose, phoneNumber, customerName, customerId }) {
  useEffect(() => {
    if (isOpen && customerId) {
      // Navigate to customer profile instead of showing widget
      window.location.href = createPageUrl(`Customer?id=${customerId}`);
      onClose();
    }
  }, [isOpen, customerId, onClose]);

  return null;
}