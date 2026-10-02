import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface BarcodeDisplayProps {
  value: string;
  studentName?: string;
  classGroup?: string;
  width?: number;
  height?: number;
  showText?: boolean;
}

// Convert a string to an authentic Code 128-like bar pattern for visual barcode
function generateBarcodePattern(text: string): number[] {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) % 100000;
  }
  
  // Predictable pattern based on text characters
  const bars: number[] = [2, 1, 1, 2]; // Start sentinel
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    bars.push((code % 3) + 1);
    bars.push(((code >> 2) % 3) + 1);
    bars.push(((code >> 4) % 3) + 1);
    bars.push((code % 2) + 1);
  }
  bars.push(2, 3, 1, 2); // Stop sentinel
  return bars;
}

export const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({
  value,
  studentName,
  classGroup,
  width = 240,
  height = 70,
  showText = true,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const bars = generateBarcodePattern(value);

  useEffect(() => {
    QRCode.toDataURL(
      value,
      {
        width: 160,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [value]);

  // Calculate total bar units
  const totalUnits = bars.reduce((acc, curr) => acc + curr, 0);
  const unitWidth = (width - 16) / totalUnits;

  let currentX = 8;

  return (
    <div className="flex flex-col items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
      {/* 1D Barcode SVG */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <rect width={width} height={height} fill="#ffffff" rx="6" />
        {bars.map((barWidth, index) => {
          const x = currentX;
          const w = barWidth * unitWidth;
          currentX += w;
          // Alternate dark and light bars
          if (index % 2 === 0) {
            return (
              <rect
                key={index}
                x={x}
                y={6}
                width={Math.max(1.2, w * 0.9)}
                height={height - 12}
                fill="#0f172a"
              />
            );
          }
          return null;
        })}
      </svg>

      {showText && (
        <div className="mt-1 text-center">
          <span className="font-mono text-xs tracking-widest font-black text-slate-900 block">
            *{value}*
          </span>
          {studentName && (
            <span className="text-[11px] font-bold text-blue-900">
              {studentName} {classGroup ? `(${classGroup})` : ''}
            </span>
          )}
        </div>
      )}

      {/* Optional QR Code Preview */}
      {qrDataUrl && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
          <img src={qrDataUrl} alt={`QR Code ${value}`} className="w-12 h-12 rounded-lg border border-slate-200" />
          <div className="text-left text-[10px] text-slate-500 leading-tight">
            <strong className="text-slate-800 block">QR Biometrik</strong>
            <span>Scan via kamera gate</span>
          </div>
        </div>
      )}
    </div>
  );
};
