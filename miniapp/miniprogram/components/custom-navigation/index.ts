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
    showMark: {
      type: Boolean,
      value: true,
    },
    title: {
      type: String,
      value: "常州 AI Club",
    },
  },
  data: getNavigationLayout(),
});
