export function isMiniappBasicProfileReady(user: MiniappUser) {
  const serverValue = (
    user as MiniappUser & { basicProfileReady?: boolean }
  ).basicProfileReady;
  if (typeof serverValue === "boolean") return serverValue;

  const displayName = user.displayName.trim();
  return Boolean(displayName && displayName !== "微信用户");
}
