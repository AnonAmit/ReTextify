'use client';

import React, { createContext, useContext, useState } from 'react';

interface FileContextType {
    file: File | null;
    setFile: (file: File | null) => void;
    fileDataUrl: string | null;
    setFileDataUrl: (url: string | null) => void;
}

const FileContext = createContext<FileContextType>({
    file: null,
    setFile: () => { },
    fileDataUrl: null,
    setFileDataUrl: () => { },
});

export const FileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [file, setFile] = useState<File | null>(null);
    const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);

    return (
        <FileContext.Provider value={{ file, setFile, fileDataUrl, setFileDataUrl }}>
            {children}
        </FileContext.Provider>
    );
};

export const useFileContext = () => useContext(FileContext);
