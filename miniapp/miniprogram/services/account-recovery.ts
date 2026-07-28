import { apiRequest } from "./api";

type StartRecoveryResponse = {
  expiresAt: string;
  message: string;
  recoveryToken: string;
};

type VerifyRecoveryResponse = {
  preview: MiniappAccountRecoveryPreview;
};

type ConfirmRecoveryResponse = {
  merged: boolean;
  user: MiniappUser;
};

export function startAccountRecovery(email: string) {
  return apiRequest<StartRecoveryResponse>({
    path: "/api/miniapp/account-recovery/start",
    method: "POST",
    authenticated: true,
    data: { email },
  });
}

export function verifyAccountRecovery(input: {
  code: string;
  email: string;
  recoveryToken: string;
}) {
  return apiRequest<VerifyRecoveryResponse>({
    path: "/api/miniapp/account-recovery/verify",
    method: "POST",
    authenticated: true,
    data: input,
  });
}

export function confirmAccountRecovery(input: {
  choices: {
    avatarUrl: "source" | "target";
    displayName: "source" | "target";
    wechat: "source" | "target";
  };
  recoveryToken: string;
}) {
  return apiRequest<ConfirmRecoveryResponse>({
    path: "/api/miniapp/account-recovery/confirm",
    method: "POST",
    authenticated: true,
    data: input,
  });
}
