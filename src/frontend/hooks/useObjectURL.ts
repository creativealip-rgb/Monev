"use client";

import { useState, useEffect } from "react";

export function useObjectURL(file: File | string | null) {
    const [url, setUrl] = useState<string>("");

    useEffect(() => {
        if (!file) {
            setUrl("");
            return;
        }

        if (typeof file === "string") {
            setUrl(file);
            return;
        }

        // Create object URL for File/Blob
        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);

        // Cleanup: revoke URL when component unmounts or file changes
        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [file]);

    return url;
}
