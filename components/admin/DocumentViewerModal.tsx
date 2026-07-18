"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Maximize } from "lucide-react";
import Image from "next/image";

interface DocumentViewerModalProps {
  title: string;
  src: string;
  label?: string;
}

export function DocumentViewerModal({ title, src, label }: DocumentViewerModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenNewTab = () => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { margin: 0; background: #0f172a; display: flex; justify-content: center; align-items: center; height: 100vh; }
              img { max-width: 100%; max-height: 100%; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${src}" alt="${title}" />
          </body>
        </html>
      `);
      newWindow.document.close();
    } else {
      // Fallback if popups are blocked
      setIsOpen(true);
    }
  };

  // Determine if src is base64
  const isBase64 = src.startsWith("data:");

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="h-7 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200" 
        onClick={handleOpenNewTab}
      >
        <FileText className="w-3 h-3 mr-1" /> 
        {label || title}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden relative border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            {isBase64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={src} 
                alt={title} 
                className="max-w-full max-h-full object-contain" 
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={src} 
                alt={title} 
                className="max-w-full max-h-full object-contain" 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
