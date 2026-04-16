import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";

export type IRtcEngine = any;
export type IRtcEngineEventHandler = any;

function loadAgoraModule(): any {
  const dynamicRequire = (globalThis as any).__non_webpack_require__ ?? eval("require");
  return dynamicRequire("react-native-agora");
}

export function createAgoraRtcEngine(): IRtcEngine {
  return loadAgoraModule().createAgoraRtcEngine();
}

export const ChannelProfileType = new Proxy(
  {},
  {
    get: (_target, prop) => loadAgoraModule().ChannelProfileType[prop as any],
  },
) as any;

export const ClientRoleType = new Proxy(
  {},
  {
    get: (_target, prop) => loadAgoraModule().ClientRoleType[prop as any],
  },
) as any;

export const VideoSourceType = new Proxy(
  {},
  {
    get: (_target, prop) => loadAgoraModule().VideoSourceType[prop as any],
  },
) as any;

type SurfaceProps = ViewProps & { canvas?: unknown; children?: ReactNode };

export function RtcSurfaceView({ canvas: _canvas, children, ...rest }: SurfaceProps) {
  if (typeof document !== "undefined") {
    return <View {...rest}>{children}</View>;
  }
  const Component = loadAgoraModule().RtcSurfaceView;
  return <Component canvas={_canvas} {...rest}>{children}</Component>;
}
