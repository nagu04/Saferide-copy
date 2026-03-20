import React, { useRef, useEffect } from 'react';

interface CanvasLiveFeedProps {
  cameraId: string; // e.g., "CAM-001"
  width?: number;
  height?: number;
}

export function CanvasLiveFeed({ cameraId, width = 640, height = 360 }: CanvasLiveFeedProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let abort = false;

    // MJPEG streaming via fetch
    const fetchMJPEG = async () => {
      try {
        const response = await fetch(`http://localhost:8000/camera-feed/${cameraId}`);
        const reader = response.body?.getReader();
        if (!reader) return;

        let buffer = new Uint8Array(0);

        while (!abort) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;

          // append new bytes
          const tmp = new Uint8Array(buffer.length + value.length);
          tmp.set(buffer, 0);
          tmp.set(value, buffer.length);
          buffer = tmp;

          // MJPEG frames are separated by JPEG start/end markers: 0xFFD8 ... 0xFFD9
          let start = buffer.indexOf(0xff);
          while (start >= 0 && start < buffer.length - 1) {
            if (buffer[start] === 0xff && buffer[start + 1] === 0xd8) {
              let end = buffer.indexOf(0xff, start + 2);
              while (end >= 0 && end < buffer.length - 1) {
                if (buffer[end] === 0xff && buffer[end + 1] === 0xd9) {
                  const frame = buffer.slice(start, end + 2);
                  const blob = new Blob([frame], { type: 'image/jpeg' });
                  const img = new Image();
                  img.onload = () => {
                    ctx.clearRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);
                  };
                  img.src = URL.createObjectURL(blob);

                  // remove processed frame from buffer
                  buffer = buffer.slice(end + 2);
                  start = buffer.indexOf(0xff);
                  break;
                } else end++;
              }
            } else start++;
          }
        }
      } catch (err) {
        console.error('MJPEG fetch error', err);
      }
    };

    fetchMJPEG();

    return () => {
      abort = true;
    };
  }, [cameraId, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} className="w-full h-full bg-black" />;
}