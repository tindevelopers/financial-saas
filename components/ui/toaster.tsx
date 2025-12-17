'use client';

import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';

export function Toaster() {
  const { toasts } = useToast();

  useEffect(() => {
    console.log('[Toaster] Component mounted')
    console.log('[Toaster] Toasts:', {
      count: toasts.length,
      toasts: toasts.map(t => ({
        id: t.id,
        titleType: typeof t.title,
        descriptionType: typeof t.description,
        title: typeof t.title === 'string' ? t.title : typeof t.title,
        description: typeof t.description === 'string' ? t.description : typeof t.description,
      })),
    })
  }, [toasts])

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // Log what we're rendering
        console.log('[Toaster] Rendering toast:', {
          id,
          titleType: typeof title,
          descriptionType: typeof description,
          titleValue: title,
          descriptionValue: description,
        })
        
        // Ensure title and description are strings or React elements, not objects
        const safeTitle = typeof title === 'string' || React.isValidElement(title) ? title : String(title)
        const safeDescription = typeof description === 'string' || React.isValidElement(description) ? description : (description ? String(description) : null)
        
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {safeTitle && <ToastTitle>{safeTitle}</ToastTitle>}
              {safeDescription && (
                <ToastDescription>{safeDescription}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
