import { trackEvent } from "../../services/analytics";
import { ApiError, getStoredSessionToken } from "../../services/api";
import { ensureSession } from "../../services/auth";
import {
  cancelCommunityBooking,
  loadCommunitySpace,
  submitCommunityAccessRequest,
  submitCommunityBooking,
} from "../../services/community";
import { isMiniappBasicProfileReady } from "../../utils/profile-state";

type ResourceMode = "desk" | "meeting_room";
type ResourceViewMode = "map" | "list";

type CommunityResourceItem = MiniappCommunitySpaceResource & {
  availabilityClass: string;
  availabilityLabel: string;
  isActiveMode: boolean;
  selectable: boolean;
  style: string;
};

type CommunityBookingItem = MiniappCommunitySpaceBooking & {
  dateLabel: string;
  statusLabel: string;
  timeLabel: string;
};

type DateOption = {
  label: string;
  shortDate: string;
  value: string;
};

const durationOptions = [1, 2, 4, 8];
const weekdayLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
let hasLoaded = false;
let requestVersion = 0;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function buildDateOptions() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return {
      label: index === 0 ? "今天" : index === 1 ? "明天" : weekdayLabels[date.getDay()],
      shortDate: `${date.getMonth() + 1}/${date.getDate()}`,
      value: formatDateValue(date),
    };
  });
}

function getDefaultSchedule(dateOptions: DateOption[]) {
  const now = new Date();
  const nextHour = now.getMinutes() > 0 ? now.getHours() + 1 : now.getHours();
  if (nextHour >= 24) {
    return { selectedDateIndex: 1, startTime: "00:00" };
  }
  return {
    selectedDateIndex: 0,
    startTime: `${pad(Math.max(nextHour, 8))}:00`,
  };
}

function buildWindow(dateValue: string, startTime: string, durationHours: number) {
  const startsAt = new Date(`${dateValue}T${startTime}:00+08:00`);
  const endsAt = new Date(startsAt.getTime() + durationHours * 60 * 60 * 1_000);
  return {
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  };
}

function formatBeijingParts(value: string) {
  const date = new Date(value);
  const beijingDate = new Date(date.getTime() + 8 * 60 * 60 * 1_000);
  return {
    dateLabel: `${beijingDate.getUTCMonth() + 1}月${beijingDate.getUTCDate()}日`,
    timeLabel: `${pad(beijingDate.getUTCHours())}:${pad(beijingDate.getUTCMinutes())}`,
  };
}

function getAvailabilityMeta(availability: MiniappCommunityAvailability) {
  if (availability === "available") {
    return { label: "可预约", className: "available" };
  }
  if (availability === "booked") {
    return { label: "已预约", className: "booked" };
  }
  if (availability === "fixed") {
    return { label: "固定工位", className: "fixed" };
  }
  return { label: "暂停使用", className: "disabled" };
}

function mapResource(
  resource: MiniappCommunitySpaceResource,
  activeMode: ResourceMode,
): CommunityResourceItem {
  const availability = getAvailabilityMeta(resource.availability);
  return {
    ...resource,
    availabilityClass: availability.className,
    availabilityLabel: availability.label,
    isActiveMode: resource.resourceType === activeMode,
    selectable: resource.availability === "available",
    style: [
      `left:${resource.x}%`,
      `top:${resource.y}%`,
      `width:${resource.width}%`,
      `height:${resource.height}%`,
      `transform:rotate(${resource.rotation}deg)`,
    ].join(";"),
  };
}

function mapBooking(booking: MiniappCommunitySpaceBooking): CommunityBookingItem {
  const start = formatBeijingParts(booking.startsAt);
  const end = formatBeijingParts(booking.endsAt);
  return {
    ...booking,
    dateLabel: start.dateLabel,
    timeLabel:
      start.dateLabel === end.dateLabel
        ? `${start.timeLabel}—${end.timeLabel}`
        : `${start.timeLabel}—${end.dateLabel} ${end.timeLabel}`,
    statusLabel: booking.status === "confirmed" ? "已确认" : "已取消",
  };
}

function buildPlaceholderResources(activeMode: ResourceMode) {
  const desks = Array.from({ length: 24 }, (_, index) => {
    const row = Math.floor(index / 4);
    const column = index % 4;
    return {
      id: `placeholder-desk-${index + 1}`,
      code: `D${pad(index + 1)}`,
      name: `工位 ${pad(index + 1)}`,
      resourceType: "desk" as const,
      deskMode: "flexible" as const,
      capacity: 1,
      areaLabel: "办公大厅",
      x: 8 + column * 13,
      y: 16 + row * 11,
      width: 9,
      height: 7,
      rotation: 0,
      availability: "disabled" as const,
      isMine: false,
    };
  });
  const rooms: MiniappCommunitySpaceResource[] = [
    {
      id: "placeholder-room-1",
      code: "MR-01",
      name: "会议室 1",
      resourceType: "meeting_room",
      deskMode: null,
      capacity: 6,
      areaLabel: "前台右侧",
      x: 66,
      y: 12,
      width: 27,
      height: 20,
      rotation: 0,
      availability: "disabled",
      isMine: false,
    },
    {
      id: "placeholder-room-2",
      code: "MR-02",
      name: "会议室 2",
      resourceType: "meeting_room",
      deskMode: null,
      capacity: 8,
      areaLabel: "办公大厅南侧",
      x: 9,
      y: 83,
      width: 34,
      height: 14,
      rotation: 0,
      availability: "disabled",
      isMine: false,
    },
  ];
  return [...desks, ...rooms].map((resource) =>
    mapResource(resource, activeMode),
  );
}

function getBookingErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return "预约失败，请稍后重试";
  if (error.errorCode === "space_resource_already_booked") return "刚刚被其他成员预约了，请换一个";
  if (error.errorCode === "community_membership_required") return "当前账号还不是可预约社区成员";
  if (error.errorCode === "community_profile_required") return "请先设置社区昵称";
  if (error.errorCode === "meeting_purpose_required") return "请填写会议用途";
  if (error.errorCode === "attendee_count_exceeds_capacity") return "参会人数超过会议室容量";
  if (error.errorCode === "booking_time_in_past") return "请选择未来的预约时段";
  return "预约失败，请稍后重试";
}

Page({
  data: {
    community: {
      title: "AI Club OPC 共创社区",
      summary: "让 OPC、社区成员和真实项目在同一个空间里持续发生连接。",
      location: "武进区中以创新园 18 号楼 5 楼",
      openHours: "24 小时开放",
      pricing: "社区成员免费",
      eligibility: "社区成员与已入驻 OPC",
      deskCount: 24,
      flexibleDeskMinimum: 6,
      meetingRoomCount: 2,
    },
    activeMode: "desk" as ResourceMode,
    viewMode: "map" as ResourceViewMode,
    dateOptions: [] as DateOption[],
    selectedDateIndex: 0,
    startTime: "09:00",
    durationHours: 4,
    durationOptions,
    windowLabel: "",
    resources: [] as CommunityResourceItem[],
    visibleResources: [] as CommunityResourceItem[],
    selectedResource: null as CommunityResourceItem | null,
    availability: {
      flexibleDeskCount: 24,
      availableDeskCount: 0,
      availableMeetingRoomCount: 0,
    },
    attendeeOptions: [1],
    attendeeIndex: 0,
    meetingPurpose: "",
    myBookings: [] as CommunityBookingItem[],
    accessRequest: null as MiniappCommunityAccessRequest | null,
    accessContact: "",
    accessNote: "",
    mapScale: 1,
    mapX: 0,
    mapY: 0,
    isLoggedIn: Boolean(getStoredSessionToken()),
    currentUser: null as MiniappUser | null,
    avatarUrl: "",
    avatarInitial: "我",
    loading: true,
    loadFailed: false,
    submitting: false,
    accessSubmitting: false,
  },

  onLoad() {
    const dateOptions = buildDateOptions();
    const schedule = getDefaultSchedule(dateOptions);
    const resources = buildPlaceholderResources("desk");
    this.setData({
      dateOptions,
      ...schedule,
      resources,
      visibleResources: resources.filter((item) => item.resourceType === "desk"),
    });
    void this.loadPage();
    void ensureSession()
      .then((user) => {
        getApp<IAppOption>().globalData.currentUser = user;
        this.setData({
          currentUser: user,
          isLoggedIn: true,
          avatarUrl: user.avatarUrl ?? "",
          avatarInitial: user.displayName.slice(0, 1) || "我",
        });
        trackEvent("community_view", "/pages/community/index");
      })
      .catch(() => undefined);
  },

  onShow() {
    if (!hasLoaded) return;
    const isLoggedIn = Boolean(getStoredSessionToken());
    this.setData({ isLoggedIn });
    if (isLoggedIn) {
      void ensureSession()
        .then((user) => {
          getApp<IAppOption>().globalData.currentUser = user;
          this.setData({
            currentUser: user,
            avatarUrl: user.avatarUrl ?? "",
            avatarInitial: user.displayName.slice(0, 1) || "我",
          });
          return this.loadPage(false);
        })
        .catch(() => this.loadPage(false));
    }
  },

  onPullDownRefresh() {
    void this.loadPage(false).finally(() => wx.stopPullDownRefresh());
  },

  getWindow() {
    const date = this.data.dateOptions[this.data.selectedDateIndex];
    return buildWindow(date.value, this.data.startTime, this.data.durationHours);
  },

  async loadPage(showLoading = true) {
    const currentRequest = ++requestVersion;
    if (showLoading) this.setData({ loading: true, loadFailed: false });
    const window = this.getWindow();
    this.updateWindowLabel(window.startsAt, window.endsAt);

    try {
      const snapshot = await loadCommunitySpace(window.startsAt, window.endsAt);
      if (currentRequest !== requestVersion) return;
      hasLoaded = true;
      const resources = snapshot.resources.map((resource) =>
        mapResource(resource, this.data.activeMode),
      );
      const selectedResource = this.data.selectedResource
        ? resources.find((resource) => resource.id === this.data.selectedResource?.id) ?? null
        : null;
      this.setData({
        community: snapshot.community,
        resources,
        visibleResources: resources.filter(
          (resource) => resource.resourceType === this.data.activeMode,
        ),
        selectedResource:
          selectedResource?.availability === "available" ? selectedResource : null,
        availability: snapshot.availability,
        myBookings: snapshot.myBookings.map(mapBooking),
        accessRequest: snapshot.accessRequest,
        accessContact: snapshot.accessRequest?.contact ?? this.data.accessContact,
        accessNote: snapshot.accessRequest?.note ?? this.data.accessNote,
        loading: false,
        loadFailed: false,
      });
    } catch {
      if (currentRequest !== requestVersion) return;
      hasLoaded = true;
      this.setData({ loading: false, loadFailed: true });
    }
  },

  updateWindowLabel(startsAt: string, endsAt: string) {
    const start = formatBeijingParts(startsAt);
    const end = formatBeijingParts(endsAt);
    this.setData({
      windowLabel:
        start.dateLabel === end.dateLabel
          ? `${start.dateLabel} ${start.timeLabel}—${end.timeLabel}`
          : `${start.dateLabel} ${start.timeLabel}—${end.dateLabel} ${end.timeLabel}`,
    });
  },

  switchMode(event: WechatMiniprogram.TouchEvent) {
    const activeMode = String(event.currentTarget.dataset.mode) as ResourceMode;
    if (!(["desk", "meeting_room"] as string[]).includes(activeMode)) return;
    const resources = this.data.resources.map((resource) =>
      mapResource(resource, activeMode),
    );
    this.setData({
      activeMode,
      durationHours: activeMode === "desk" ? 4 : 1,
      resources,
      visibleResources: resources.filter(
        (resource) => resource.resourceType === activeMode,
      ),
      selectedResource: null,
      meetingPurpose: "",
      attendeeIndex: 0,
      attendeeOptions: [1],
    });
    void this.loadPage(false);
  },

  switchView(event: WechatMiniprogram.TouchEvent) {
    const viewMode = String(event.currentTarget.dataset.view) as ResourceViewMode;
    if (viewMode === "map" || viewMode === "list") this.setData({ viewMode });
  },

  changeDate(event: WechatMiniprogram.TouchEvent) {
    const selectedDateIndex = Number(event.currentTarget.dataset.index);
    if (!Number.isInteger(selectedDateIndex)) return;
    this.setData({ selectedDateIndex, selectedResource: null });
    void this.loadPage(false);
  },

  changeStartTime(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ startTime: event.detail.value, selectedResource: null });
    void this.loadPage(false);
  },

  changeDuration(event: WechatMiniprogram.TouchEvent) {
    const durationHours = Number(event.currentTarget.dataset.duration);
    if (!durationOptions.includes(durationHours)) return;
    this.setData({ durationHours, selectedResource: null });
    void this.loadPage(false);
  },

  selectResource(event: WechatMiniprogram.TouchEvent) {
    const resourceId = String(event.currentTarget.dataset.id ?? "");
    const resource = this.data.resources.find((item) => item.id === resourceId);
    if (!resource) return;
    if (!resource.selectable) {
      void wx.showToast({ title: resource.availabilityLabel, icon: "none" });
      return;
    }
    const attendeeOptions = Array.from(
      { length: resource.resourceType === "meeting_room" ? resource.capacity : 1 },
      (_, index) => index + 1,
    );
    this.setData({
      activeMode: resource.resourceType,
      selectedResource: resource,
      attendeeOptions,
      attendeeIndex: Math.min(this.data.attendeeIndex, attendeeOptions.length - 1),
    });
  },

  resetMap() {
    this.setData({ mapScale: 1, mapX: 0, mapY: 0 });
  },

  handleMapScale(event: WechatMiniprogram.CustomEvent<{ scale: number }>) {
    this.setData({ mapScale: event.detail.scale });
  },

  handlePurposeInput(event: WechatMiniprogram.Input) {
    this.setData({ meetingPurpose: event.detail.value });
  },

  changeAttendeeCount(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ attendeeIndex: Number(event.detail.value) || 0 });
  },

  async requireCommunityUser() {
    if (!getStoredSessionToken()) {
      void wx.navigateTo({ url: "/pages/login/index?intent=community" });
      return null;
    }
    try {
      const user = await ensureSession();
      if (!isMiniappBasicProfileReady(user)) {
        void wx.navigateTo({
          url: "/pages/profile/basic/index?intent=community",
        });
        return null;
      }
      this.setData({
        currentUser: user,
        isLoggedIn: true,
        avatarUrl: user.avatarUrl ?? "",
        avatarInitial: user.displayName.slice(0, 1) || "我",
      });
      return user;
    } catch {
      void wx.navigateTo({ url: "/pages/login/index?intent=community" });
      return null;
    }
  },

  async confirmBooking() {
    const resource = this.data.selectedResource;
    if (!resource || this.data.submitting) return;
    const user = await this.requireCommunityUser();
    if (!user) return;
    const purpose = this.data.meetingPurpose.trim();
    if (resource.resourceType === "meeting_room" && !purpose) {
      void wx.showToast({ title: "请填写会议用途", icon: "none" });
      return;
    }

    const window = this.getWindow();
    this.setData({ submitting: true });
    try {
      await submitCommunityBooking({
        resourceId: resource.id,
        startsAt: window.startsAt,
        endsAt: window.endsAt,
        purpose,
        attendeeCount: this.data.attendeeOptions[this.data.attendeeIndex] ?? 1,
      });
      trackEvent("community_booking_success", "/pages/community/index", {
        resourceType: resource.resourceType,
      });
      this.setData({ selectedResource: null, meetingPurpose: "" });
      await this.loadPage(false);
      void wx.showToast({ title: "预约成功", icon: "success" });
    } catch (error) {
      void wx.showToast({ title: getBookingErrorMessage(error), icon: "none" });
      await this.loadPage(false);
    } finally {
      this.setData({ submitting: false });
    }
  },

  cancelBooking(event: WechatMiniprogram.TouchEvent) {
    const bookingId = String(event.currentTarget.dataset.id ?? "");
    if (!bookingId) return;
    wx.showModal({
      title: "取消预约",
      content: "确认取消这次空间预约吗？",
      confirmText: "取消预约",
      confirmColor: "#d44d3d",
      success: (result) => {
        if (result.confirm) void this.performCancelBooking(bookingId);
      },
    });
  },

  async performCancelBooking(bookingId: string) {
    try {
      await cancelCommunityBooking(bookingId);
      await this.loadPage(false);
      void wx.showToast({ title: "已取消", icon: "success" });
    } catch {
      void wx.showToast({ title: "当前预约无法取消", icon: "none" });
    }
  },

  handleAccessContactInput(event: WechatMiniprogram.Input) {
    this.setData({ accessContact: event.detail.value });
  },

  handleAccessNoteInput(event: WechatMiniprogram.Input) {
    this.setData({ accessNote: event.detail.value });
  },

  async submitAccessRequest() {
    if (this.data.accessSubmitting) return;
    const user = await this.requireCommunityUser();
    if (!user) return;
    const contact = this.data.accessContact.trim();
    if (contact.length < 2) {
      void wx.showToast({ title: "请填写联系方式", icon: "none" });
      return;
    }
    this.setData({ accessSubmitting: true });
    try {
      const response = await submitCommunityAccessRequest({
        contact,
        note: this.data.accessNote.trim(),
      });
      this.setData({ accessRequest: response.accessRequest });
      trackEvent("community_access_request", "/pages/community/index");
      void wx.showToast({ title: "申领记录已提交", icon: "success" });
    } catch (error) {
      void wx.showToast({
        title:
          error instanceof ApiError &&
          error.errorCode === "community_membership_required"
            ? "当前账号还不是社区成员"
            : "提交失败，请稍后重试",
        icon: "none",
      });
    } finally {
      this.setData({ accessSubmitting: false });
    }
  },

  openProfile() {
    if (!getStoredSessionToken()) {
      void wx.navigateTo({ url: "/pages/login/index?intent=profile" });
      return;
    }
    void wx.navigateTo({ url: "/pages/profile/index" });
  },
});
