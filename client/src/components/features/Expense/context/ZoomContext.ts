// src/context/ZoomBoundaryContext.ts
import { createContext, useContext } from 'react';

export const ZoomBoundaryContext = createContext<DOMRect | null>(null);
export const useZoomBoundary = () => useContext(ZoomBoundaryContext);
