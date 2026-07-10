import { ensureSession } from "./services/auth";

App<IAppOption>({
  globalData: {
    currentUser: null,
  },

  onLaunch() {
    void ensureSession()
      .then((user) => {
        this.globalData.currentUser = user;
      })
      .catch(() => {
        this.globalData.currentUser = null;
      });
  },
});
