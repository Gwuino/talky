'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useSettingsStore } from '@/stores/settingsStore';
import { Mic, Volume2, Video } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DeviceInfo {
  deviceId: string;
  label: string;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { audioInputId, audioOutputId, videoInputId, setAudioInput, setAudioOutput, setVideoInput } = useSettingsStore();
  const [audioInputs, setAudioInputs] = useState<DeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<DeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<DeviceInfo[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    async function loadDevices() {
      try {
        // Request permission first to get labeled devices
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then((s) => {
          s.getTracks().forEach((t) => t.stop());
        }).catch(() => {
          // Try audio only if video fails
          return navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => {
            s.getTracks().forEach((t) => t.stop());
          });
        }).catch(() => {});

        const devices = await navigator.mediaDevices.enumerateDevices();

        setAudioInputs(
          devices
            .filter((d) => d.kind === 'audioinput' && d.deviceId)
            .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${i + 1}` }))
        );
        setAudioOutputs(
          devices
            .filter((d) => d.kind === 'audiooutput' && d.deviceId)
            .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Speaker ${i + 1}` }))
        );
        setVideoInputs(
          devices
            .filter((d) => d.kind === 'videoinput' && d.deviceId)
            .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` }))
        );
      } catch (err) {
        console.error('Failed to enumerate devices:', err);
      }
    }

    loadDevices();
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-5">
        {/* Microphone */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase text-text-secondary mb-2">
            <Mic size={14} /> Microphone
          </label>
          <select
            value={audioInputId || ''}
            onChange={(e) => setAudioInput(e.target.value || null)}
            className="w-full rounded bg-bg-tertiary border border-border px-3 py-2.5 text-text-primary text-sm focus:border-accent outline-none"
          >
            <option value="">Default</option>
            {audioInputs.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
            ))}
          </select>
        </div>

        {/* Speakers */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase text-text-secondary mb-2">
            <Volume2 size={14} /> Speakers
          </label>
          <select
            value={audioOutputId || ''}
            onChange={(e) => setAudioOutput(e.target.value || null)}
            className="w-full rounded bg-bg-tertiary border border-border px-3 py-2.5 text-text-primary text-sm focus:border-accent outline-none"
          >
            <option value="">Default</option>
            {audioOutputs.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
            ))}
          </select>
        </div>

        {/* Camera */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase text-text-secondary mb-2">
            <Video size={14} /> Camera
          </label>
          <select
            value={videoInputId || ''}
            onChange={(e) => setVideoInput(e.target.value || null)}
            className="w-full rounded bg-bg-tertiary border border-border px-3 py-2.5 text-text-primary text-sm focus:border-accent outline-none"
          >
            <option value="">Default</option>
            {videoInputs.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
}
