'use client';

import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  onReconnect: () => void;
}

export function ConnectionStatus({ 
  connectionStatus, 
  onReconnect 
}: ConnectionStatusProps) {
  return (
    <div className="bg-amber-100 connection-status flex items-center justify-between px-4 py-1 text-xs">
      <div className="text-gray-700 font-medium">
        You are talking with your personal DoveText AI Assistant
      </div>
      {connectionStatus === 'connected' && (
        <div className="flex items-center text-green-600">
          <Wifi className="w-3 h-3 mr-1" />
          <span>Connected</span>
        </div>
      )}
      {connectionStatus === 'reconnecting' && (
        <div className="flex items-center text-amber-600">
          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          <span>Reconnecting...</span>
        </div>
      )}
      {connectionStatus === 'disconnected' && (
        <div className="flex items-center gap-2">
          <div className="text-red-600 flex items-center">
            <WifiOff className="w-3 h-3 mr-1" />
            <span>Disconnected</span>
          </div>
          <button
            onClick={onReconnect}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            <span>Reconnect</span>
          </button>
        </div>
      )}
    </div>
  );
}
