export interface ServiceMeta {
  name: string;
  color: string;
  priority: number;
}

/** Maps Platfone service_id slugs → display metadata */
export const PLATFONE_SERVICES: Record<string, ServiceMeta> = {
  whatsapp:   { name: "WhatsApp",    color: "#25D366", priority: 1  },
  instagram:  { name: "Instagram",   color: "#E1306C", priority: 2  },
  facebook:   { name: "Facebook",    color: "#1877F2", priority: 3  },
  telegram:   { name: "Telegram",    color: "#0088cc", priority: 4  },
  google:     { name: "Google",      color: "#4285F4", priority: 5  },
  twitter:    { name: "Twitter / X", color: "#000000", priority: 6  },
  tiktok:     { name: "TikTok",      color: "#010101", priority: 7  },
  youtube:    { name: "YouTube",     color: "#FF0000", priority: 8  },
  spotify:    { name: "Spotify",     color: "#1DB954", priority: 9  },
  discord:    { name: "Discord",     color: "#5865F2", priority: 10 },
  linkedin:   { name: "LinkedIn",    color: "#0A66C2", priority: 11 },
  snapchat:   { name: "Snapchat",    color: "#FFFC00", priority: 12 },
  pinterest:  { name: "Pinterest",   color: "#E60023", priority: 13 },
  signal:     { name: "Signal",      color: "#3A76F0", priority: 14 },
  viber:      { name: "Viber",       color: "#7360F2", priority: 15 },
  wechat:     { name: "WeChat",      color: "#07C160", priority: 16 },
  skype:      { name: "Skype",       color: "#00AFF0", priority: 17 },
  amazon:     { name: "Amazon",      color: "#FF9900", priority: 18 },
  apple:      { name: "Apple",       color: "#555555", priority: 19 },
  microsoft:  { name: "Microsoft",   color: "#00A4EF", priority: 20 },
  paypal:     { name: "PayPal",      color: "#003087", priority: 21 },
  reddit:     { name: "Reddit",      color: "#FF4500", priority: 22 },
  netflix:    { name: "Netflix",     color: "#E50914", priority: 23 },
  uber:       { name: "Uber",        color: "#000000", priority: 24 },
  tinder:     { name: "Tinder",      color: "#FE3C72", priority: 25 },
  bumble:     { name: "Bumble",      color: "#FFC629", priority: 26 },
  badoo:      { name: "Badoo",       color: "#6B16A7", priority: 27 },
  vk:         { name: "VKontakte",   color: "#0077FF", priority: 28 },
  ok:         { name: "OK.ru",       color: "#EE8208", priority: 29 },
  mailru:     { name: "Mail.ru",     color: "#005FF9", priority: 30 },
  gmail:      { name: "Gmail",       color: "#EA4335", priority: 31 },
  yahoo:      { name: "Yahoo",       color: "#6001D2", priority: 32 },
  walmart:    { name: "Walmart",     color: "#0071CE", priority: 50 },
  ebay:       { name: "eBay",        color: "#E53238", priority: 51 },
  alibaba:    { name: "Alibaba",     color: "#FF6A00", priority: 52 },
  shopee:     { name: "Shopee",      color: "#EE4D2D", priority: 53 },
  grab:       { name: "Grab",        color: "#00B14F", priority: 54 },
  lazada:     { name: "Lazada",      color: "#F57224", priority: 55 },
  booking:    { name: "Booking.com", color: "#003580", priority: 56 },
  expedia:    { name: "Expedia",     color: "#FBCC33", priority: 57 },
  airbnb:     { name: "Airbnb",      color: "#FF5A5F", priority: 58 },
  steam:      { name: "Steam",       color: "#1B2838", priority: 59 },
  quora:      { name: "Quora",       color: "#B92B27", priority: 60 },
  line:       { name: "Line",        color: "#00C300", priority: 61 },
  kakaotalk:  { name: "KakaoTalk",   color: "#FAE100", priority: 62 },
  zalo:       { name: "Zalo",        color: "#0068FF", priority: 63 },
  fiverr:     { name: "Fiverr",      color: "#1DBF73", priority: 70 },
  upwork:     { name: "Upwork",      color: "#14A800", priority: 71 },
  freelancer: { name: "Freelancer",  color: "#29B2FE", priority: 72 },
  bereal:     { name: "BeReal",      color: "#000000", priority: 73 },
  clubhouse:  { name: "Clubhouse",   color: "#F1EFE3", priority: 74 },
  okcupid:    { name: "OkCupid",     color: "#1A4DE2", priority: 75 },
  "7eleven":  { name: "7-Eleven",    color: "#008000", priority: 80 },
  other:      { name: "Other",       color: "#888888", priority: 999 },
};

export function getServiceMeta(serviceId: string): ServiceMeta {
  const key = serviceId.toLowerCase();
  return (
    PLATFONE_SERVICES[key] ?? {
      name: serviceId.charAt(0).toUpperCase() + serviceId.slice(1),
      color: "#7C5CFC",
      priority: 998,
    }
  );
}
