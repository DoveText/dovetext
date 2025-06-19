'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/common/dialog';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Simple Progress component for the dialog
export const Progress = ({ value, className = '' }: { value: number, className?: string }) => {
  return (
    <div className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-100 ${className}`}>
      <div 
        className="h-full w-full flex-1 bg-blue-500 transition-all" 
        style={{ width: `${Math.min(Math.max(0, value), 100)}%` }}
      />
    </div>
  );
};

export interface BaseAIDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  loading?: boolean;
  progress?: number;
  error?: string | null;
  actionButtonText?: string;
  onSubmit?: (e: React.FormEvent) => void;
  children?: React.ReactNode;
}

export default function BaseAIDialog({
  isOpen,
  onClose,
  title,
  description,
  loading = false,
  progress = 0,
  error = null,
  actionButtonText = 'Submit',
  onSubmit,
  children
}: BaseAIDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={onClose}
            >
              <XMarkIcon className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          {description && (
            <p className="text-sm text-gray-500 mt-2">
              {description}
            </p>
          )}
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="p-6 pt-2">
          {/* Show error message if there was an error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}
          
          {/* Dialog content */}
          {children}
          
          {/* Show progress bar during loading */}
          {loading && (
            <div className="space-y-2 bg-blue-50 p-4 rounded-md border border-blue-100 mt-4">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-blue-700">Processing your request...</span>
                <span className="text-blue-700">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-blue-600 mt-2">Our AI is generating content based on your input. This may take a moment.</p>
            </div>
          )}
            
          <DialogFooter className="pt-4 border-t border-gray-100 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={loading}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" /> Processing...
                </>
              ) : (
                actionButtonText
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
