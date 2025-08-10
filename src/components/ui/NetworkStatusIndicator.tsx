import React, { useState, useEffect } from 'react';
import {
  isOffline,
  isSlowConnection,
  addConnectionListeners,
  addConnectionChangeListener,
  NetworkInfo,
  getNetworkInfo
} from '../../utils/networkUtils';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

/**
 * NetworkStatusIndicator Component
 *
 * This component displays the current network status and provides feedback to users
 * about offline status, slow connections, and reconnection attempts.
 */
const NetworkStatusIndicator: React.FC = () => {
  const [offline, setOffline] = useState(isOffline());
  const [slowConnection, setSlowConnection] = useState(isSlowConnection());
  const [visible, setVisible] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(getNetworkInfo());

  useEffect(() => {
    // Set initial state
    setOffline(isOffline());
    setSlowConnection(isSlowConnection());
    setNetworkInfo(getNetworkInfo());

    // Add listeners for online/offline events
    const cleanupConnectionListeners = addConnectionListeners(
      // Online callback
      () => {
        setOffline(false);
        setVisible(true);
        // Hide the indicator after 3 seconds
        setTimeout(() => setVisible(false), 3000);
      },
      // Offline callback
      () => {
        setOffline(true);
        setVisible(true);
      }
    );

    // Add listener for connection changes
    const cleanupChangeListener = addConnectionChangeListener((info) => {
      setNetworkInfo(info);
      setSlowConnection(isSlowConnection());

      // Show the indicator when connection type changes
      setVisible(true);
      // Hide the indicator after 3 seconds if online
      if (info.online && !isSlowConnection()) {
        setTimeout(() => setVisible(false), 3000);
      }
    });

    // Cleanup listeners on unmount
    return () => {
      cleanupConnectionListeners();
      cleanupChangeListener();
    };
  }, []);

  // Don't render anything if not visible and online
  if (!visible && !offline) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 p-3 rounded-lg shadow-lg transition-all duration-300 ${
        offline
          ? 'bg-red-500 text-white'
          : slowConnection
            ? 'bg-yellow-500 text-white'
            : 'bg-green-500 text-white'
      } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      <div className="flex items-center space-x-2">
        {offline ? (
          <>
            <WifiOff size={18} />
            <span className="font-medium">You are offline</span>
          </>
        ) : slowConnection ? (
          <>
            <AlertTriangle size={18} />
            <span className="font-medium">Slow connection detected</span>
          </>
        ) : (
          <>
            <Wifi size={18} />
            <span className="font-medium">Connected</span>
          </>
        )}
      </div>

      {/* Show connection details if available */}
      {!offline && networkInfo.connectionType !== 'unknown' && (
        <div className="text-xs mt-1 opacity-90">
          {networkInfo.connectionType.toUpperCase()} •
          {networkInfo.downlink.toFixed(1)} Mbps •
          {networkInfo.rtt} ms
        </div>
      )}

      {/* Show retry button when offline */}
      {offline && (
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 text-sm font-medium rounded-md bg-card text-destructive-foreground hover:bg-card/80 w-full"
        >
          Retry Connection
        </button>
      )}
    </div>
  );
};

export default NetworkStatusIndicator;
