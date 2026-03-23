import './Modal.css';
import type { ModalProps } from '@/types/props';
import { Button } from './Button';

export const Modal = ({ onClose, children, title }: ModalProps) => (
  <div className="modal-overlay">
    <div className="modal-content">
      {title && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-white">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 p-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      )}
      {children}
    </div>
  </div>
);
