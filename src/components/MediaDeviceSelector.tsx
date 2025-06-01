import React from 'react';

interface MediaDeviceSelectorProps {
  devices: MediaDeviceInfo[];
  selectedVideo: string;
  selectedAudio: string;
  onVideoChange: (deviceId: string) => void;
  onAudioChange: (deviceId: string) => void;
}

export const MediaDeviceSelector: React.FC<MediaDeviceSelectorProps> = ({
  devices,
  selectedVideo,
  selectedAudio,
  onVideoChange,
  onAudioChange,
}) => {
  const videoDevices = devices.filter(device => device.kind === 'videoinput');
  const audioDevices = devices.filter(device => device.kind === 'audioinput');

  if (videoDevices.length === 0 && audioDevices.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800 p-4 flex flex-wrap gap-4">
      {videoDevices.length > 0 && (
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="videoDevice" className="block text-sm font-medium text-gray-300 mb-2">
            Caméra
          </label>
          <select
            id="videoDevice"
            value={selectedVideo}
            onChange={(e) => onVideoChange(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {videoDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Caméra ${videoDevices.indexOf(device) + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {audioDevices.length > 0 && (
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="audioDevice" className="block text-sm font-medium text-gray-300 mb-2">
            Microphone
          </label>
          <select
            id="audioDevice"
            value={selectedAudio}
            onChange={(e) => onAudioChange(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {audioDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};