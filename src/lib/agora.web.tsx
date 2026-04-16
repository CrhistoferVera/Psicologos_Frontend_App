import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";

export type IRtcEngineEventHandler = {
  onJoinChannelSuccess?: (connection: { channelId: string }) => void;
  onUserJoined?: (_connection: unknown, uid: number) => void;
  onUserOffline?: (_connection: unknown, uid: number) => void;
  onError?: (error: number, message: string) => void;
};

export type IRtcEngine = {
  initialize: (_options: unknown) => void;
  registerEventHandler: (_handler: IRtcEngineEventHandler) => void;
  unregisterEventHandler: (_handler: IRtcEngineEventHandler) => void;
  enableAudio: () => void;
  enableVideo: () => void;
  enableLocalVideo: (_enabled: boolean) => void;
  muteLocalVideoStream: (_muted: boolean) => void;
  joinChannel: (_token: string, _channelName: string, _uid: number, _options: unknown) => void;
  setEnableSpeakerphone: (_enabled: boolean) => void;
  adjustPlaybackSignalVolume: (_value: number) => void;
  adjustRecordingSignalVolume: (_value: number) => void;
  leaveChannel: () => void;
  release: () => void;
  muteLocalAudioStream: (_muted: boolean) => void;
  startPreview: () => void;
  stopPreview: () => void;
  switchCamera: () => void;
};

function createNoopEngine(): IRtcEngine {
  return {
    initialize: () => {},
    registerEventHandler: () => {},
    unregisterEventHandler: () => {},
    enableAudio: () => {},
    enableVideo: () => {},
    enableLocalVideo: () => {},
    muteLocalVideoStream: () => {},
    joinChannel: () => {},
    setEnableSpeakerphone: () => {},
    adjustPlaybackSignalVolume: () => {},
    adjustRecordingSignalVolume: () => {},
    leaveChannel: () => {},
    release: () => {},
    muteLocalAudioStream: () => {},
    startPreview: () => {},
    stopPreview: () => {},
    switchCamera: () => {},
  };
}

export function createAgoraRtcEngine(): IRtcEngine {
  return createNoopEngine();
}

export const ChannelProfileType = {
  ChannelProfileCommunication: 0,
} as const;

export const ClientRoleType = {
  ClientRoleBroadcaster: 0,
} as const;

export const VideoSourceType = {
  VideoSourceRemote: 0,
} as const;

type SurfaceProps = ViewProps & { canvas?: unknown; children?: ReactNode };

export function RtcSurfaceView({ canvas: _canvas, children, ...rest }: SurfaceProps) {
  return <View {...rest}>{children}</View>;
}
