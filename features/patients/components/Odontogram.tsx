import React, { useState } from 'react';
import { cn } from '../../../lib/utils';
import { Treatment } from '../../../types';
import { Layers, Grid, Baby, User } from 'lucide-react';

interface OdontogramProps {
  treatments: Treatment[];
  onToothClick: (toothId: string, surface?: string) => void;
}

type ViewMode = 'anatomical' | 'geometric';
type DentitionType = 'adult' | 'child';

// --- FDI Notation Data ---

// Adult (Permanent)
const ADULT_Q1 = [18, 17, 16, 15, 14, 13, 12, 11];
const ADULT_Q2 = [21, 22, 23, 24, 25, 26, 27, 28];
const ADULT_Q4 = [48, 47, 46, 45, 44, 43, 42, 41];
const ADULT_Q3 = [31, 32, 33, 34, 35, 36, 37, 38];

// Child (Deciduous)
const CHILD_Q5 = [55, 54, 53, 52, 51];
const CHILD_Q6 = [61, 62, 63, 64, 65];
const CHILD_Q8 = [85, 84, 83, 82, 81];
const CHILD_Q7 = [71, 72, 73, 74, 75];

const getToothType = (id: number) => {
  const n = id % 10;
  if (n >= 1 && n <= 2) return 'incisor'; 
  if (n === 3) return 'canine'; 
  if (n >= 4 && n <= 5) return 'premolar'; 
  return 'molar'; 
};

const isAnterior = (id: number) => {
    const n = id % 10;
    return n >= 1 && n <= 3;
};

// --- SVG COMPONENTS ---

// 1. ANATOMICAL VIEW (Realistic)
const ToothAnatomical: React.FC<{ 
  id: number; 
  status: 'planned' | 'completed' | 'mixed' | null; 
  onClick: () => void 
}> = ({ id, status, onClick }) => {
  const type = getToothType(id);
  const isUpper = (id >= 11 && id <= 28) || (id >= 51 && id <= 65);
  
  // Paths for general shape (simplified for UI clarity)
  const paths = {
    molar: {
      root: "M10,50 C10,30 5,10 15,5 C25,0 25,20 30,35 C35,20 35,0 45,5 C55,10 50,30 50,50 Z",
      crown: "M10,50 C5,60 5,85 10,90 C20,95 40,95 50,90 C55,85 55,60 50,50 C40,55 20,55 10,50 Z"
    },
    premolar: {
      root: "M15,50 C15,30 20,5 30,5 C40,5 45,30 45,50 Z",
      crown: "M15,50 C10,60 10,80 15,85 C25,90 35,90 45,85 C50,80 50,60 45,50 C35,55 25,55 15,50 Z"
    },
    canine: {
      root: "M20,50 C20,20 25,0 30,0 C35,0 40,20 40,50 Z",
      crown: "M20,50 C15,60 20,90 30,95 C40,90 45,60 40,50 C35,52 25,52 20,50 Z"
    },
    incisor: {
      root: "M22,50 C22,25 25,5 30,5 C35,5 38,25 38,50 Z",
      crown: "M22,50 C20,60 20,85 22,90 C25,92 35,92 38,90 C40,85 40,60 38,50 C35,52 25,52 22,50 Z"
    }
  }[type];

  // Styling
  const crownClass = status === 'completed' ? 'fill-green-400 dark:fill-green-600' : 
                     status === 'planned' ? 'fill-blue-400 dark:fill-blue-600' :
                     status === 'mixed' ? 'fill-orange-400 dark:fill-orange-600' :
                     'fill-white dark:fill-surface-800 hover:fill-surface-50 dark:hover:fill-surface-700';

  const transform = isUpper ? "" : `scale(1, -1) translate(0, -100)`;
  const width = type === 'molar' ? 40 : type === 'premolar' ? 35 : 30;

  return (
    <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={onClick}>
       {isUpper && <span className={cn("text-[10px] font-bold mb-1 transition-colors select-none", status ? "text-primary-600" : "text-surface-400")}>{id}</span>}
       <svg width={width} height={60} viewBox="0 0 60 100" className="drop-shadow-sm group-hover:scale-110 transition-transform duration-200">
         <g transform={transform}>
           <path d={paths.root} className="fill-surface-100 dark:fill-surface-700 stroke-surface-300 dark:stroke-surface-600 stroke-1" />
           <path d={paths.crown} className={cn(crownClass, "stroke-surface-400 dark:stroke-surface-500 stroke-1 transition-colors")} />
         </g>
       </svg>
       {!isUpper && <span className={cn("text-[10px] font-bold mt-1 transition-colors select-none", status ? "text-primary-600" : "text-surface-400")}>{id}</span>}
    </div>
  );
};

// 2. GEOMETRIC VIEW (Clinical Surface Chart)
const ToothGeometric: React.FC<{ 
    id: number; 
    treatments: Treatment[];
    onPartClick: (part: string) => void;
  }> = ({ id, treatments, onPartClick }) => {
    
    const isUpper = (id >= 11 && id <= 28) || (id >= 51 && id <= 65);
    
    // Quadrant logic for Mesial/Distal mapping
    // Right Side of Patient (Viewer Left): Q1 (11-18), Q4 (41-48), Q5, Q8
    // Left Side of Patient (Viewer Right): Q2 (21-28), Q3 (31-38), Q6, Q7
    const isRightSide = (id >= 11 && id <= 18) || (id >= 41 && id <= 48) || (id >= 51 && id <= 55) || (id >= 81 && id <= 85);

    const mapPartToSurface = (part: 'top' | 'bottom' | 'left' | 'right' | 'center') => {
      if (part === 'center') return 'Occlusal'; // or Incisal
      
      // Vertical (V/L)
      if (isUpper) {
          if (part === 'top') return 'Vestibular';
          if (part === 'bottom') return 'Palatal'; 
      } else { // Lower
          if (part === 'top') return 'Lingual';
          if (part === 'bottom') return 'Vestibular';
      }
  
      // Horizontal (M/D)
      if (isRightSide) {
          // Viewer Left: Right of tooth is towards midline (Mesial)
          if (part === 'right') return 'Mesial';
          if (part === 'left') return 'Distal';
      } else {
          // Viewer Right: Left of tooth is towards midline (Mesial)
          if (part === 'left') return 'Mesial';
          if (part === 'right') return 'Distal';
      }
      return 'Unknown';
    };
  
    const getStatusForSurface = (surface: string) => {
        const relevant = treatments.filter(t => t.tooth === id.toString());
        // Check exact surface match
        let specific = relevant.find(t => t.surface === surface);
        // Fallback: Check description for keyword
        if (!specific) specific = relevant.find(t => t.description && t.description.includes(surface));
        
        if (specific) return specific.status;
        
        // If "General" treatment exists (no surface), highlight Occlusal/Center
        const general = relevant.find(t => !t.surface);
        if (general && surface === 'Occlusal') return general.status;
        
        return null;
    };
  
    const getFill = (visualPart: 'top' | 'bottom' | 'left' | 'right' | 'center') => {
        const surfaceName = mapPartToSurface(visualPart);
        const status = getStatusForSurface(surfaceName);
        
        if (status === 'completed') return 'fill-green-500 dark:fill-green-600';
        if (status === 'planned') return 'fill-blue-500 dark:fill-blue-600';
        return 'fill-white dark:fill-surface-800 hover:fill-surface-100 dark:hover:fill-surface-700';
    };
  
    // --- SVG PATHS (Circle with 5 Sectors) ---
    // A standard "Target" style for clinical charting
    // Center circle = Occlusal
    // Trapezoids = Surfaces
    
    // Coordinate System: 100x100
    // Center: 50,50
    const paths = {
        center: "M 50,50 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0",
        top:    "M 35,36 L 20,20 Q 50,5 80,20 L 65,36 A 15,15 0 0,0 35,36",
        bottom: "M 35,64 L 20,80 Q 50,95 80,80 L 65,64 A 15,15 0 0,0 35,64",
        left:   "M 35,36 L 20,20 Q 5,50 20,80 L 35,64 A 15,15 0 0,0 35,36",
        right:  "M 65,36 L 80,20 Q 95,50 80,80 L 65,64 A 15,15 0 0,0 65,36"
    };

    return (
      <div className="flex flex-col items-center gap-1 group relative">
         {isUpper && <span className="text-[10px] font-bold mb-0.5 text-surface-400 select-none">{id}</span>}
         
         <svg width={36} height={36} viewBox="0 0 100 100" className="drop-shadow-sm transition-transform duration-200 group-hover:scale-110">
            <circle cx="50" cy="50" r="48" className="fill-none stroke-surface-200 dark:stroke-surface-700 stroke-[4]" />
            <g className="stroke-surface-300 dark:stroke-surface-600 stroke-[2] cursor-pointer">
              {Object.entries(paths).map(([part, d]) => (
                  <path 
                      key={part} 
                      d={d} 
                      className={cn(getFill(part as any), "transition-colors duration-200")}
                      onClick={(e) => {
                          e.stopPropagation();
                          onPartClick(mapPartToSurface(part as any));
                      }}
                  >
                      <title>{mapPartToSurface(part as any)}</title>
                  </path>
              ))}
            </g>
         </svg>
         
         {!isUpper && <span className="text-[10px] font-bold mt-0.5 text-surface-400 select-none">{id}</span>}
      </div>
    );
  };

// --- MAIN COMPONENT ---

export const Odontogram: React.FC<OdontogramProps> = ({ treatments, onToothClick }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('geometric');
  const [dentition, setDentition] = useState<DentitionType>('adult');

  const getToothStatus = (id: number) => {
    const toothTreatments = treatments.filter(t => t.tooth === id.toString());
    if (toothTreatments.length === 0) return null;
    const hasCompleted = toothTreatments.some(t => t.status === 'completed');
    const hasPlanned = toothTreatments.some(t => t.status === 'planned');
    if (hasCompleted && hasPlanned) return 'mixed';
    if (hasCompleted) return 'completed';
    return 'planned';
  };

  const renderQuadrant = (ids: number[], align: 'start' | 'end') => {
      const Component = viewMode === 'anatomical' ? ToothAnatomical : ToothGeometric;
      
      return (
          <div className={cn("flex gap-1 md:gap-2", align === 'end' ? "justify-end" : "justify-start")}>
              {ids.map(id => (
                  <Component 
                    key={id} 
                    id={id} 
                    status={viewMode === 'anatomical' ? getToothStatus(id) : null}
                    treatments={treatments}
                    onClick={() => onToothClick(id.toString())}
                    onPartClick={(s) => onToothClick(id.toString(), s)}
                  />
              ))}
          </div>
      );
  };

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* Controls */}
      <div className="flex flex-wrap gap-4 justify-between w-full max-w-3xl mb-6">
          {/* View Mode */}
          <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-lg">
            <button
                onClick={() => setViewMode('geometric')}
                className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all",
                    viewMode === 'geometric' 
                        ? "bg-white dark:bg-surface-700 text-primary-600 shadow-sm" 
                        : "text-surface-500 hover:text-surface-900 dark:text-surface-400"
                )}
            >
                <Grid size={14} /> Clinical
            </button>
            <button
                onClick={() => setViewMode('anatomical')}
                className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all",
                    viewMode === 'anatomical' 
                        ? "bg-white dark:bg-surface-700 text-primary-600 shadow-sm" 
                        : "text-surface-500 hover:text-surface-900 dark:text-surface-400"
                )}
            >
                <Layers size={14} /> Anatomical
            </button>
          </div>

          {/* Dentition Toggle */}
          <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-lg">
            <button
                onClick={() => setDentition('adult')}
                className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all",
                    dentition === 'adult' 
                        ? "bg-white dark:bg-surface-700 text-primary-600 shadow-sm" 
                        : "text-surface-500 hover:text-surface-900 dark:text-surface-400"
                )}
            >
                <User size={14} /> Adult
            </button>
            <button
                onClick={() => setDentition('child')}
                className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all",
                    dentition === 'child' 
                        ? "bg-white dark:bg-surface-700 text-primary-600 shadow-sm" 
                        : "text-surface-500 hover:text-surface-900 dark:text-surface-400"
                )}
            >
                <Baby size={14} /> Child
            </button>
          </div>
      </div>

      {/* Chart Area */}
      <div className="w-full overflow-x-auto pb-4 custom-scrollbar flex justify-center">
          <div className="flex flex-col gap-8 px-4 min-w-[600px] select-none">
            
            {dentition === 'adult' ? (
                <>
                    {/* Upper Arch */}
                    <div className="flex justify-center items-end gap-4 pb-6 border-b border-dashed border-surface-200 dark:border-surface-700">
                        {renderQuadrant(ADULT_Q1, 'end')}
                        <div className="w-px h-16 bg-surface-300 dark:bg-surface-600 opacity-50"></div>
                        {renderQuadrant(ADULT_Q2, 'start')}
                    </div>
                    {/* Lower Arch */}
                    <div className="flex justify-center items-start gap-4 pt-2">
                        {renderQuadrant(ADULT_Q4, 'end')}
                        <div className="w-px h-16 bg-surface-300 dark:bg-surface-600 opacity-50"></div>
                        {renderQuadrant(ADULT_Q3, 'start')}
                    </div>
                </>
            ) : (
                <>
                    {/* Child Upper */}
                    <div className="flex justify-center items-end gap-4 pb-6 border-b border-dashed border-surface-200 dark:border-surface-700">
                        {renderQuadrant(CHILD_Q5, 'end')}
                        <div className="w-px h-12 bg-surface-300 dark:bg-surface-600 opacity-50"></div>
                        {renderQuadrant(CHILD_Q6, 'start')}
                    </div>
                    {/* Child Lower */}
                    <div className="flex justify-center items-start gap-4 pt-2">
                        {renderQuadrant(CHILD_Q8, 'end')}
                        <div className="w-px h-12 bg-surface-300 dark:bg-surface-600 opacity-50"></div>
                        {renderQuadrant(CHILD_Q7, 'start')}
                    </div>
                </>
            )}

          </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs font-medium text-surface-600 dark:text-surface-400">
        <div className="flex items-center gap-2 bg-surface-50 dark:bg-surface-800 px-3 py-1.5 rounded-full border border-surface-200 dark:border-surface-700">
            <div className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-600" />
            <span>Planned Treatment</span>
        </div>
        <div className="flex items-center gap-2 bg-surface-50 dark:bg-surface-800 px-3 py-1.5 rounded-full border border-surface-200 dark:border-surface-700">
            <div className="w-3 h-3 rounded-full bg-green-500 dark:bg-green-600" />
            <span>Completed</span>
        </div>
      </div>
    </div>
  );
};
