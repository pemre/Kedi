import React from "react";
import { Download, CheckCircle, XCircle, Pause, Play, X } from "lucide-react";
import { FileDownloadProgress } from "../types/electron";
import { Button } from "./ui/button";

interface DownloadProgressToastProps {
  progress: FileDownloadProgress;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
}

export function DownloadProgressToast({ progress, onPause, onResume, onCancel }: DownloadProgressToastProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getIcon = () => {
    switch (progress.status) {
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'paused':
        return <Pause className="h-5 w-5 text-yellow-500" />;
      case 'canceled':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Download className="h-5 w-5 text-blue-500 animate-pulse" />;
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'complete':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'canceled':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const showControls = progress.status === 'downloading' || progress.status === 'paused';

  return (
    <div className="flex flex-col gap-2 min-w-[320px]">
      <div className="flex items-center gap-3">
        {getIcon()}
        <div className="flex-1">
          <div className="text-sm font-medium">{progress.message}</div>
          {progress.downloadedSize !== undefined && progress.totalSize !== undefined && (
            <div className="text-xs text-white/60">
              {formatBytes(progress.downloadedSize)} / {formatBytes(progress.totalSize)}
            </div>
          )}
        </div>
        {progress.percentage !== undefined && (progress.status === 'downloading' || progress.status === 'paused') && (
          <div className="text-sm font-medium text-white/80">
            {progress.percentage}%
          </div>
        )}
      </div>

      {(progress.status === 'downloading' || progress.status === 'paused') && progress.percentage !== undefined && (
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full ${getStatusColor()} transition-all duration-300 ease-out`}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      )}

      {showControls && (
        <div className="flex gap-2 mt-1">
          {progress.status === 'downloading' && onPause && (
            <Button
              size="sm"
              variant="outline"
              onClick={onPause}
              className="h-7 text-xs bg-white/5 border-white/20 hover:bg-white/10"
            >
              <Pause className="h-3 w-3 mr-1" />
              Pause
            </Button>
          )}
          {progress.status === 'paused' && onResume && (
            <Button
              size="sm"
              variant="outline"
              onClick={onResume}
              className="h-7 text-xs bg-white/5 border-white/20 hover:bg-white/10"
            >
              <Play className="h-3 w-3 mr-1" />
              Resume
            </Button>
          )}
          {onCancel && (
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              className="h-7 text-xs bg-red-500/20 border-red-500/40 hover:bg-red-500/30 text-red-200"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
