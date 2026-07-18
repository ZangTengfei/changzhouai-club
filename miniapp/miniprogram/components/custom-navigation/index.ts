function getNavigationLayout() {
  const windowInfo = wx.getWindowInfo();
  const menuButton = wx.getMenuButtonBoundingClientRect();
  const statusBarHeight = windowInfo.statusBarHeight || 0;
  const menuButtonOffset = Math.max(menuButton.top - statusBarHeight, 0);

  return {
    navigationBarHeight: menuButtonOffset * 2 + menuButton.height,
    rightInset: Math.max(windowInfo.windowWidth - menuButton.left + 8, 96),
    statusBarHeight,
  };
}

Component({
  properties: {
    avatarInitial: {
      type: String,
      value: "微",
    },
    avatarUrl: {
      type: String,
      value: "",
    },
    showMark: {
      type: Boolean,
      value: false,
    },
    showAvatar: {
      type: Boolean,
      value: false,
    },
    title: {
      type: String,
      value: "常州 AI Club",
    },
  },
  data: getNavigationLayout(),
});
