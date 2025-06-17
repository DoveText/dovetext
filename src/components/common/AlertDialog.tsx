'use client';

import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/common/dialog/Dialog';
import { Button } from '@/components/common/Button';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isConfirmation?: boolean;
  onConfirm?: () => void;
  cancelLabel?: string;
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel = 'OK',
  isConfirmation = false,
  onConfirm,
  cancelLabel = 'Cancel'
}: AlertDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-gray-700">{message}</p>
        </div>
        <DialogFooter className="flex justify-end space-x-2">
          {isConfirmation ? (
            <>
              <Button onClick={onClose} variant="outline" className="w-full sm:w-auto">
                {cancelLabel}
              </Button>
              <Button 
                onClick={() => {
                  if (onConfirm) onConfirm();
                  onClose();
                }} 
                className="w-full sm:w-auto"
              >
                {confirmLabel}
              </Button>
            </>
          ) : (
            <Button onClick={onClose} className="w-full sm:w-auto">
              {confirmLabel}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
