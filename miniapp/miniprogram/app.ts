import { ensureSession } from "./services/auth";

function setupUpdateManager() {
  if (typeof wx.getUpdateManager !== "function") return;

  const updateManager = wx.getUpdateManager();

  updateManager.onUpdateReady(() => {
    void wx.showModal({
      title: "发现新版本",
      content: "新版本已下载，重启后即可使用。请确认当前填写内容已保存。",
      confirmText: "立即重启",
      cancelText: "稍后",
      success(result) {
        if (result.confirm) updateManager.applyUpdate();
      },
    });
  });

  updateManager.onUpdateFailed(() => {
    void wx.showModal({
      title: "更新失败",
      content: "新版本下载失败，请检查网络后重新打开小程序。",
      showCancel: false,
      confirmText: "我知道了",
    });
  });
}

App<IAppOption>({
  globalData: {
    currentUser: null,
  },

  onLaunch() {
    setupUpdateManager();

    void ensureSession()
      .then((user) => {
        this.globalData.currentUser = user;
      })
      .catch(() => {
        this.globalData.currentUser = null;
      });
  },
});
