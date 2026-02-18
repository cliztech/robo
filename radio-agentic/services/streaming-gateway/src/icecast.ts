export type IcecastConfig = {
  host: string;
  port: number;
  mount: string;
  user: string;
  pass: string;
};

export function icecastUrl(cfg: IcecastConfig): string {
  return `icecast://${encodeURIComponent(cfg.user)}:${encodeURIComponent(cfg.pass)}@${cfg.host}:${cfg.port}${cfg.mount}`;
}
