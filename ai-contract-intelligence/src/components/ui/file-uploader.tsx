"use client";

import { useState } from "react";
import { Button } from "./button";
import { UploadCloud, FileText } from "lucide-react";

interface FileUploaderProps {
    onUploadComplete: (file?: File) => void;
}

export function FileUploader({ onUploadComplete }: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            simulateUpload(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            simulateUpload(e.target.files[0]);
        }
    };

    const simulateUpload = (file?: File) => {
        setIsUploading(true);
        // Fake network delay
        setTimeout(() => {
            onUploadComplete(file);
        }, 1500);
    };

    return (
        <div className="w-full max-w-xl mx-auto">
            <div
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all bg-white
                ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300"}
                ${isUploading ? "opacity-50 pointer-events-none" : "hover:border-slate-400"}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="bg-slate-100 p-4 rounded-full mb-4">
                    {isUploading ? <UploadCloud className="w-8 h-8 text-blue-600 animate-bounce" /> : <FileText className="w-8 h-8 text-slate-500" />}
                </div>

                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {isUploading ? "Uploading Securely..." : "Upload Contract PDF"}
                </h3>

                <p className="text-slate-500 text-center mb-6 max-w-xs">
                    Drag and drop your scanned PDF here, or click to browse.
                    <br /><span className="text-xs text-slate-400">(Supports OCR for scanned images)</span>
                </p>

                <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileSelect}
                />
                <Button onClick={() => document.getElementById('file-upload')?.click()} disabled={isUploading}>
                    {isUploading ? "Encrypting..." : "Select File"}
                </Button>
            </div>
        </div>
    );
}
