import React, { createContext, useContext, useState, useEffect } from 'react';
import { Device } from '@twilio/voice-sdk';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const VoiceContext = createContext(null);

export const useVoice = () => useContext(VoiceContext);

export const VoiceProvider = ({ children }) => {
  const { user } = useAuth();
  const [device, setDevice] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [showCallWidget, setShowCallWidget] = useState(false);
  const [currentLead, setCurrentLead] = useState(null);
  const [currentEventId, setCurrentEventId] = useState(null);

  useEffect(() => {
    if (!user) {
      if (device) {
        device.destroy();
        setDevice(null);
      }
      return;
    }

    let activeDevice = null;

    const initDevice = async () => {
      try {
        const { data } = await api.post('/api/v1/voice/token');
        const newDevice = new Device(data.token, {
          codecPreferences: ['opus', 'pcmu'],
          fakeLocalDTMF: true,
          enableIceRestart: true
        });

        newDevice.on('registered', () => {
          console.log('Twilio Voice Device registered successfully');
        });

        newDevice.on('error', (error) => {
          console.error('Twilio Voice Device registration error:', error);
        });

        newDevice.on('incoming', (call) => {
          console.log('Incoming call event received:', call);
          setIncomingCall(call);
        });

        await newDevice.register();
        activeDevice = newDevice;
        setDevice(newDevice);
      } catch (err) {
        console.error('Failed to initialize Twilio Voice Device:', err);
      }
    };

    initDevice();

    return () => {
      if (activeDevice) {
        activeDevice.destroy();
      }
    };
  }, [user]);

  const startCall = async (phone, leadData, eventId) => {
    if (!device) {
      throw new Error('Twilio Voice Device is not initialized');
    }
    setCurrentLead(leadData);
    setCurrentEventId(eventId);
    setShowCallWidget(true);

    try {
      const call = await device.connect({
        params: {
          number: phone,
          eventId: eventId
        }
      });
      setActiveCall(call);
      return call;
    } catch (err) {
      console.error('Error connecting outbound call:', err);
      throw err;
    }
  };

  return (
    <VoiceContext.Provider
      value={{
        device,
        incomingCall,
        setIncomingCall,
        activeCall,
        setActiveCall,
        startCall,
        showCallWidget,
        setShowCallWidget,
        currentLead,
        setCurrentLead,
        currentEventId,
        setCurrentEventId
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};
