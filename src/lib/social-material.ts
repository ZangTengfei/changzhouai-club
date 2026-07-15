import type { WechatArticleTemplateId } from "@/lib/wechat-article-template";

export type WechatMaterialSettings = {
  templateId: WechatArticleTemplateId;
  footerTemplateId: WechatArticleTemplateId;
  videoTitle: string;
  videoDescription: string;
  videoActionLabel: string;
  videoUrl: string;
  relatedLinksText: string;
};

export type WechatFooterTemplatePreset = {
  id: WechatArticleTemplateId;
  name: string;
  description: string;
  videoTitle: string;
  videoDescription: string;
  videoActionLabel: string;
  videoUrl: string;
  relatedLinksText: string;
};

const defaultRelatedLinksText = `查看更多社区动态 | https://changzhouai.club/updates | 活动复盘、成员实践与项目进展
浏览近期活动与报名 | https://changzhouai.club/events | 线下活动、沙龙和共创报名`;

export const wechatFooterTemplatePresets: WechatFooterTemplatePreset[] = [
  {
    id: "community",
    name: "社区标准底部",
    description: "视频号、社区动态、活动入口和公众号二维码。",
    videoTitle: "看现场片段与活动花絮",
    videoDescription: "短视频、直播回放和活动花絮会优先沉淀到视频号。",
    videoActionLabel: "搜索：常州 AI Club",
    videoUrl: "",
    relatedLinksText: defaultRelatedLinksText,
  },
  {
    id: "official",
    name: "官方通稿底部",
    description: "适合园区、机构和合作方转载的稳重收尾。",
    videoTitle: "持续关注常州 AI Club",
    videoDescription: "获取社区活动、产业交流与本地 AI 实践的后续动态。",
    videoActionLabel: "搜索：常州 AI Club",
    videoUrl: "",
    relatedLinksText: defaultRelatedLinksText,
  },
  {
    id: "opportunity",
    name: "项目招募底部",
    description: "突出项目机会、揭榜报名和共创入口。",
    videoTitle: "关注真实项目与共创机会",
    videoDescription: "后续项目发布、揭榜报名和需求澄清信息会持续更新。",
    videoActionLabel: "搜索：常州 AI Club",
    videoUrl: "",
    relatedLinksText: `查看共建项目 | https://changzhouai.club/projects | 项目机会、揭榜报名与共创进展
浏览近期活动与报名 | https://changzhouai.club/events | 线下活动、沙龙和项目对接`,
  },
];

export function getWechatFooterTemplatePreset(id: WechatArticleTemplateId) {
  return wechatFooterTemplatePresets.find((item) => item.id === id)
    ?? wechatFooterTemplatePresets[0];
}

export const defaultWechatMaterialSettings: WechatMaterialSettings = {
  templateId: "community",
  footerTemplateId: "community",
  videoTitle: wechatFooterTemplatePresets[0].videoTitle,
  videoDescription: wechatFooterTemplatePresets[0].videoDescription,
  videoActionLabel: wechatFooterTemplatePresets[0].videoActionLabel,
  videoUrl: wechatFooterTemplatePresets[0].videoUrl,
  relatedLinksText: wechatFooterTemplatePresets[0].relatedLinksText,
};

export type WechatSocialMaterial = {
  id: string;
  platform: "wechat";
  title: string;
  contentMarkdown: string;
  settings: WechatMaterialSettings;
  createdAt: string;
  updatedAt: string;
};

export type WechatSocialMaterialInput = Pick<
  WechatSocialMaterial,
  "title" | "contentMarkdown" | "settings"
>;
