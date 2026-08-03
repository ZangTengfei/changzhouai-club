import { trackEvent } from "../../services/analytics";
import { ApiError, getStoredSessionToken } from "../../services/api";
import { ensureSession } from "../../services/auth";
import {
  cancelCommunityBooking,
  loadCommunitySpace,
  releaseCommunityFixedDesk,
  submitCommunityAccessRequest,
  submitCommunityBooking,
  submitCommunityFixedDeskRequest,
} from "../../services/community";
import { isMiniappBasicProfileReady } from "../../utils/profile-state";

type ResourceMode = "desk" | "meeting_room";
type ResourceViewMode = "map" | "list";
type DeskUseMode = "temporary" | "fixed";

type CommunityResourceItem = MiniappCommunitySpaceResource & {
  availabilityClass: string;
  availabilityLabel: string;
  facingClass: string;
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
const spacePhotos = [
  {
    src: "https://assets.changzhouai.club/event-assets/community/space/office-v1.jpg",
    title: "AI Club OPC 共创办公区",
  },
  {
    src: "https://assets.changzhouai.club/event-assets/community/space/park-v1.jpg",
    title: "西太湖人工智能社区园区",
  },
];
let hasLoaded = false;
let requestVersion = 0;
const communityShareImageUrl = "/assets/share/home-share-v7.jpg";

function getDeskNumber(code: string, prefix: "D" | "F", maximum: number) {
  const match = code.match(new RegExp(`^${prefix}(\\d{2})$`));
  const number = match ? Number(match[1]) : 0;
  return number >= 1 && number <= maximum ? number : null;
}

function applyFloorPlanLayout(
  resource: MiniappCommunitySpaceResource,
): MiniappCommunitySpaceResource {
  const hallDeskNumber = getDeskNumber(resource.code, "D", 24);
  if (hallDeskNumber) {
    const groupIndex = Math.floor((hallDeskNumber - 1) / 6);
    const seatIndex = (hallDeskNumber - 1) % 6;
    return {
      ...resource,
      areaLabel: `办公大厅 · ${String.fromCharCode(65 + groupIndex)} 组联排桌`,
      x: 8 + (seatIndex % 3) * 11.2,
      y: 17 + groupIndex * 15 + Math.floor(seatIndex / 3) * 6.3,
      width: 10.4,
      height: 6,
      rotation: 0,
    };
  }

  const fixedDeskNumber = getDeskNumber(resource.code, "F", 6);
  if (fixedDeskNumber) {
    const seatIndex = fixedDeskNumber - 1;
    return {
      ...resource,
      areaLabel: "集中办公室",
      x: 70.2 + (seatIndex % 3) * 7.1,
      y: 36.5 + Math.floor(seatIndex / 3) * 7.4,
      width: 6.4,
      height: 5.8,
      rotation: 0,
    };
  }

  if (resource.code === "MR-02") {
    return {
      ...resource,
      name: "会议室",
      areaLabel: "办公大厅南侧",
      x: 8,
      y: 79,
      width: 34,
      height: 14,
      rotation: 0,
    };
  }

  return resource;
}

function getDeskFacingClass(code: string) {
  const deskNumber = getDeskNumber(code, "D", 24) ?? getDeskNumber(code, "F", 6);
  if (!deskNumber) return "";
  return (deskNumber - 1) % 6 < 3 ? "desk-facing-south" : "desk-facing-north";
}

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

function buildDeskDayWindow(dateValue: string) {
  const dayStart = new Date(`${dateValue}T00:00:00+08:00`);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1_000);
  const now = new Date();
  const startsAt = formatDateValue(now) === dateValue
    ? new Date(Math.min(now.getTime() + 60 * 1_000, dayEnd.getTime()))
    : dayStart;
  startsAt.setSeconds(0, 0);
  return {
    startsAt: startsAt.toISOString(),
    endsAt: dayEnd.toISOString(),
  };
}

function canBookDeskDay(dateValue: string) {
  const dayEnd = new Date(`${dateValue}T00:00:00+08:00`).getTime() + 24 * 60 * 60 * 1_000;
  return dayEnd - Date.now() >= 32 * 60 * 1_000;
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
    return { label: "常驻使用", className: "fixed" };
  }
  return { label: "暂停使用", className: "disabled" };
}

function mapResource(
  resource: MiniappCommunitySpaceResource,
  activeMode: ResourceMode,
): CommunityResourceItem {
  const positionedResource = applyFloorPlanLayout(resource);
  const availability = getAvailabilityMeta(resource.availability);
  return {
    ...positionedResource,
    availabilityClass: availability.className,
    availabilityLabel: availability.label,
    facingClass: getDeskFacingClass(resource.code),
    isActiveMode: resource.resourceType === activeMode,
    selectable:
      resource.availability === "available" ||
      (resource.resourceType === "desk" && resource.fixedApplicable),
    style: [
      `left:${positionedResource.x}%`,
      `top:${positionedResource.y}%`,
      `width:${positionedResource.width}%`,
      `height:${positionedResource.height}%`,
      `transform:rotate(${positionedResource.rotation}deg)`,
    ].join(";"),
  };
}

function mapBooking(booking: MiniappCommunitySpaceBooking): CommunityBookingItem {
  const start = formatBeijingParts(booking.startsAt);
  const end = formatBeijingParts(booking.endsAt);
  return {
    ...booking,
    dateLabel: start.dateLabel,
    timeLabel: booking.resourceType === "desk"
      ? "按天使用"
      : start.dateLabel === end.dateLabel
        ? `${start.timeLabel}—${end.timeLabel}`
        : `${start.timeLabel}—${end.dateLabel} ${end.timeLabel}`,
    statusLabel: booking.status === "confirmed" ? "已确认" : "已取消",
  };
}

function buildPlaceholderResources(activeMode: ResourceMode) {
  const desks: MiniappCommunitySpaceResource[] = Array.from(
    { length: 24 },
    (_, index) => ({
      id: `placeholder-desk-${index + 1}`,
      code: `D${pad(index + 1)}`,
      name: `工位 ${pad(index + 1)}`,
      resourceType: "desk",
      deskMode: "flexible",
      capacity: 1,
      areaLabel: "办公大厅",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      rotation: 0,
      availability: "disabled",
      fixedApplicable: false,
      isMine: false,
      fixedAssignment: null,
    }),
  );
  const fixedDesks: MiniappCommunitySpaceResource[] = Array.from(
    { length: 6 },
    (_, index) => ({
      id: `placeholder-fixed-desk-${index + 1}`,
      code: `F${pad(index + 1)}`,
      name: `集中办公室工位 ${pad(index + 1)}`,
      resourceType: "desk",
      deskMode: "fixed",
      capacity: 1,
      areaLabel: "集中办公室",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      rotation: 0,
      availability: "disabled",
      fixedApplicable: false,
      isMine: false,
      fixedAssignment: null,
    }),
  );
  const rooms: MiniappCommunitySpaceResource[] = [
    {
      id: "placeholder-room-2",
      code: "MR-02",
      name: "会议室",
      resourceType: "meeting_room",
      deskMode: null,
      capacity: 8,
      areaLabel: "办公大厅南侧",
      x: 10,
      y: 79,
      width: 34,
      height: 14,
      rotation: 0,
      availability: "disabled",
      fixedApplicable: false,
      isMine: false,
      fixedAssignment: null,
    },
  ];
  return [...desks, ...fixedDesks, ...rooms].map((resource) =>
    mapResource(resource, activeMode),
  );
}

function buildVisibleResources(
  resources: MiniappCommunitySpaceResource[],
  activeMode: ResourceMode,
) {
  const visibleResources = resources.filter((resource) => resource.code !== "MR-01");
  const resourceCodes = new Set(visibleResources.map((resource) => resource.code));
  const fixedDeskFallbacks = buildPlaceholderResources(activeMode).filter(
    (resource) => resource.code.startsWith("F") && !resourceCodes.has(resource.code),
  );
  return [
    ...visibleResources.map((resource) => mapResource(resource, activeMode)),
    ...fixedDeskFallbacks,
  ];
}

function summarizeAvailability(resources: CommunityResourceItem[]) {
  const desks = resources.filter((resource) => resource.resourceType === "desk");
  return {
    flexibleDeskCount: desks.filter(
      (resource) => resource.availability !== "fixed",
    ).length,
    availableDeskCount: desks.filter(
      (resource) => resource.availability === "available",
    ).length,
    availableMeetingRoomCount: resources.filter(
      (resource) =>
        resource.resourceType === "meeting_room" &&
        resource.availability === "available",
    ).length,
  };
}

function getBookingErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return "预约失败，请稍后重试";
  if (error.errorCode === "space_resource_already_booked") return "刚刚被其他成员预约了，请换一个";
  if (error.errorCode === "fixed_desk_unavailable") return "该工位刚刚已转为常驻使用，请换一个";
  if (error.errorCode === "community_membership_required") return "当前账号还不是可预约社区成员";
  if (error.errorCode === "community_profile_required") return "请先设置社区昵称";
  if (error.errorCode === "meeting_purpose_required") return "请填写会议用途";
  if (error.errorCode === "attendee_count_exceeds_capacity") return "参会人数超过会议室容量";
  if (error.errorCode === "booking_time_in_past") return "请选择未来的预约时段";
  return "预约失败，请稍后重试";
}

function getFixedDeskErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return "提交失败，请稍后重试";
  if (error.errorCode === "community_membership_required") {
    return "当前账号还不是可申请的社区成员";
  }
  if (error.errorCode === "community_profile_required") {
    return "请先完善社区昵称";
  }
  if (error.errorCode === "fixed_desk_already_assigned") {
    return "该工位刚刚已转为常驻，请选择其他工位";
  }
  if (error.errorCode === "fixed_desk_user_already_assigned") {
    return "你已经有常驻工位";
  }
  if (error.errorCode === "fixed_desk_request_already_submitted") {
    return "你已有一条常驻申请正在审核";
  }
  if (error.errorCode === "fixed_desk_not_applicable") {
    return "该工位当前无法申请常驻";
  }
  return "提交失败，请稍后重试";
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
      deskCount: 30,
      flexibleDeskMinimum: 6,
      fixedDeskCount: 0,
      meetingRoomCount: 1,
    },
    spacePhotos,
    spacePhotoUrls: spacePhotos.map((photo) => photo.src),
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
    deskUseMode: null as DeskUseMode | null,
    availability: {
      flexibleDeskCount: 30,
      availableDeskCount: 0,
      availableMeetingRoomCount: 0,
    },
    attendeeOptions: [1],
    attendeeIndex: 0,
    meetingPurpose: "",
    myBookings: [] as CommunityBookingItem[],
    fixedDeskRequest: null as MiniappCommunityFixedDeskRequest | null,
    myFixedDesk: null as MiniappCommunityMyFixedDesk | null,
    fixedDeskNote: "",
    fixedDeskConsent: false,
    fixedDeskSubmitting: false,
    fixedDeskReleasing: false,
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
    void wx.showShareMenu({
      menus: ["shareAppMessage", "shareTimeline"],
    });
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
    if (this.data.activeMode === "desk") return buildDeskDayWindow(date.value);
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
      const resources = buildVisibleResources(
        snapshot.resources,
        this.data.activeMode,
      );
      const selectedResource = this.data.selectedResource
        ? resources.find((resource) => resource.id === this.data.selectedResource?.id) ?? null
        : null;
      this.setData({
        community: {
          ...snapshot.community,
          fixedDeskCount: snapshot.community.fixedDeskCount ?? 0,
          meetingRoomCount: 1,
        },
        resources,
        visibleResources: resources.filter(
          (resource) => resource.resourceType === this.data.activeMode,
        ),
        selectedResource: selectedResource?.selectable ? selectedResource : null,
        availability: summarizeAvailability(resources),
        myBookings: snapshot.myBookings.map(mapBooking),
        fixedDeskRequest: snapshot.fixedDeskRequest ?? null,
        myFixedDesk: snapshot.myFixedDesk ?? null,
        fixedDeskNote:
          snapshot.fixedDeskRequest?.status === "rejected"
            ? snapshot.fixedDeskRequest.note ?? ""
            : this.data.fixedDeskNote,
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
      windowLabel: this.data.activeMode === "desk"
        ? `${start.dateLabel} · 按天使用`
        : start.dateLabel === end.dateLabel
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
      deskUseMode: null,
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
    const date = this.data.dateOptions[selectedDateIndex];
    if (this.data.activeMode === "desk" && date && !canBookDeskDay(date.value)) {
      void wx.showToast({ title: "今天已无法按天预约，请选择明天", icon: "none" });
      return;
    }
    this.setData({ selectedDateIndex, selectedResource: null, deskUseMode: null });
    void this.loadPage(false);
  },

  changeStartTime(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ startTime: event.detail.value, selectedResource: null, deskUseMode: null });
    void this.loadPage(false);
  },

  changeDuration(event: WechatMiniprogram.TouchEvent) {
    const durationHours = Number(event.currentTarget.dataset.duration);
    if (!durationOptions.includes(durationHours)) return;
    this.setData({ durationHours, selectedResource: null, deskUseMode: null });
    void this.loadPage(false);
  },

  selectResource(event: WechatMiniprogram.TouchEvent) {
    const resourceId = String(event.currentTarget.dataset.id ?? "");
    const resource = this.data.resources.find((item) => item.id === resourceId);
    if (!resource) return;
    const shareHandle = resource.fixedAssignment?.shareHandle;
    if (resource.fixedAssignment) {
      if (shareHandle) {
        void wx.navigateTo({
          url: `/pages/profile/shared/index?handle=${encodeURIComponent(shareHandle)}`,
        });
        return;
      }
      void wx.showToast({
        title: "该工位已固定使用",
        icon: "none",
      });
      return;
    }
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
      deskUseMode: null,
      attendeeOptions,
      attendeeIndex: Math.min(this.data.attendeeIndex, attendeeOptions.length - 1),
    });
  },

  chooseDeskUseMode(event: WechatMiniprogram.TouchEvent) {
    const deskUseMode = String(event.currentTarget.dataset.mode) as DeskUseMode;
    const resource = this.data.selectedResource;
    if (!resource || resource.resourceType !== "desk") return;
    if (deskUseMode === "temporary" && resource.availability !== "available") {
      void wx.showToast({ title: "该工位当天已被预约", icon: "none" });
      return;
    }
    if (deskUseMode === "fixed") {
      if (this.data.myFixedDesk) {
        void wx.showToast({ title: "你已经有常驻工位", icon: "none" });
        return;
      }
      if (this.data.fixedDeskRequest?.status === "submitted") {
        void wx.showToast({ title: "你的常驻申请正在审核", icon: "none" });
        return;
      }
      if (!resource.fixedApplicable) {
        void wx.showToast({ title: "该工位当前无法申请常驻", icon: "none" });
        return;
      }
    }
    if (deskUseMode === "temporary" || deskUseMode === "fixed") {
      this.setData({ deskUseMode });
    }
  },

  handleFixedDeskNoteInput(event: WechatMiniprogram.Input) {
    this.setData({ fixedDeskNote: event.detail.value });
  },

  changeFixedDeskConsent(
    event: WechatMiniprogram.CustomEvent<{ value: string[] }>,
  ) {
    this.setData({ fixedDeskConsent: event.detail.value.includes("consent") });
  },

  async submitFixedDeskRequest() {
    if (this.data.fixedDeskSubmitting) return;
    const user = await this.requireCommunityUser();
    if (!user) return;
    const resource = this.data.selectedResource;
    if (resource?.resourceType !== "desk" || !resource.fixedApplicable) {
      void wx.showToast({ title: "请选择可申请常驻的工位", icon: "none" });
      return;
    }
    if (!this.data.fixedDeskConsent) {
      void wx.showToast({ title: "请先确认头像和成员名片展示授权", icon: "none" });
      return;
    }

    this.setData({ fixedDeskSubmitting: true });
    try {
      const response = await submitCommunityFixedDeskRequest({
        resourceId: resource.id,
        note: this.data.fixedDeskNote.trim(),
        publicProfileConsent: true,
      });
      this.setData({
        fixedDeskRequest: response.fixedDeskRequest,
        selectedResource: null,
        deskUseMode: null,
      });
      trackEvent("community_fixed_desk_request", "/pages/community/index", {
        resourceCode: resource.code,
      });
      await this.loadPage(false);
      void wx.showToast({ title: "常驻申请已提交", icon: "success" });
    } catch (error) {
      void wx.showToast({ title: getFixedDeskErrorMessage(error), icon: "none" });
      await this.loadPage(false);
    } finally {
      this.setData({ fixedDeskSubmitting: false });
    }
  },

  releaseFixedDesk() {
    const fixedDesk = this.data.myFixedDesk;
    if (!fixedDesk || this.data.fixedDeskReleasing) return;
    wx.showModal({
      title: `释放 ${fixedDesk.resourceCode}`,
      content: "释放后该工位将立即恢复为可预约、可申请固定状态，请先搬走个人办公设备。确认继续吗？",
      confirmText: "确认释放",
      confirmColor: "#d44d3d",
      success: (result) => {
        if (result.confirm) void this.performReleaseFixedDesk(fixedDesk.resourceId);
      },
    });
  },

  async performReleaseFixedDesk(resourceId: string) {
    this.setData({ fixedDeskReleasing: true });
    try {
      await releaseCommunityFixedDesk(resourceId);
      trackEvent("community_fixed_desk_release", "/pages/community/index");
      this.setData({
        myFixedDesk: null,
        fixedDeskRequest: null,
        fixedDeskConsent: false,
        fixedDeskNote: "",
      });
      await this.loadPage(false);
      void wx.showToast({ title: "固定工位已释放", icon: "success" });
    } catch {
      void wx.showToast({ title: "当前工位无法释放，请联系工作人员", icon: "none" });
      await this.loadPage(false);
    } finally {
      this.setData({ fixedDeskReleasing: false });
    }
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
    if (resource.resourceType === "desk" && resource.availability !== "available") {
      void wx.showToast({ title: "该工位当天已被预约", icon: "none" });
      return;
    }
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
      this.setData({ selectedResource: null, deskUseMode: null, meetingPurpose: "" });
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

  previewSpacePhotos() {
    const current = this.data.spacePhotoUrls[0];
    if (!current) return;
    trackEvent("community_space_gallery_open", "/pages/community/index", {
      photoCount: this.data.spacePhotoUrls.length,
    });
    void wx.previewImage({
      current,
      urls: this.data.spacePhotoUrls,
      fail: (error) => {
        console.warn("Failed to preview community space photos.", error);
        void wx.showToast({ title: "实景照片加载失败", icon: "none" });
      },
    });
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

  onShareAppMessage() {
    trackEvent("share_event", "/pages/community/index", {
      channel: "message",
    });
    return {
      title: "常州 AI Club 共创社区｜工位、会议室和 AI 共创空间",
      path: "/pages/community/index",
      imageUrl: communityShareImageUrl,
    };
  },

  onShareTimeline() {
    trackEvent("share_event", "/pages/community/index", {
      channel: "timeline",
    });
    return {
      title: "常州 AI Club 共创社区｜工位、会议室和 AI 共创空间",
      imageUrl: communityShareImageUrl,
    };
  },
});
