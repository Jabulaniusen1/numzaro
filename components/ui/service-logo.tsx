import {
  FaFacebook,
  FaInstagram,
  FaWhatsapp,
  FaTelegram,
  FaTwitter,
  FaLinkedin,
  FaSnapchat,
  FaPinterest,
  FaReddit,
  FaDiscord,
  FaWeixin,
  FaAmazon,
  FaEbay,
  FaShopify,
  FaPaypal,
  FaGoogle,
  FaYoutube,
  FaMicrosoft,
  FaApple,
  FaSteam,
  FaSpotify,
  FaUber,
  FaAirbnb,
  FaXbox,
  FaPlaystation,
  FaGithub,
  FaDropbox,
  FaCcVisa,
  FaCcMastercard,
  FaBitcoin,
  FaEthereum,
  FaTiktok,
} from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import {
  SiAlibabadotcom,
  SiAliexpress,
  SiAlipay,
  SiWalmart,
  SiTarget,
  SiIkea,
  SiLine,
  SiKakaotalk,
  SiViber,
  SiEpicgames,
  SiNintendo,
  SiRoblox,
  SiNetflix,
  SiHbo,
  SiApplemusic,
  SiPandora,
  SiTidal,
  SiAudible,
  SiAdidas,
  SiPuma,
  SiCashapp,
  SiVenmo,
  SiZelle,
  SiChase,
  SiBankofamerica,
  SiWellsfargo,
  SiAmericanexpress,
  SiRevolut,
  SiWise,
  SiCoinbase,
  SiBinance,
  SiZoom,
  SiSlack,
  SiTeamspeak,
  SiLyft,
  SiExpedia,
  SiTripadvisor,
} from 'react-icons/si';

interface ServiceLogoProps {
  serviceName: string;
  serviceCode: string;
  size?: number;
  className?: string;
}

export function ServiceLogo({ serviceName, serviceCode, size = 20, className = "" }: ServiceLogoProps) {
  const getIconAndColor = (name: string, code: string) => {
    // Map of service names to their react-icons components and brand colors
    const iconMap: Record<string, {
      icon: React.ComponentType<{ size?: number; className?: string }> | null;
      color: string;
    }> = {
      // Social Media
      "Facebook": { icon: FaFacebook, color: "#1877F2" },
      "Instagram": { icon: FaInstagram, color: "#E4405F" },
      "Instagram+Threads": { icon: FaInstagram, color: "#E4405F" },
      "Threads": { icon: FaInstagram, color: "#E4405F" },
      "WhatsApp": { icon: FaWhatsapp, color: "#25D366" },
      "WhatsApp Business": { icon: FaWhatsapp, color: "#25D366" },
      "Telegram": { icon: FaTelegram, color: "#0088CC" },
      "TikTok": { icon: FaTiktok, color: "#000000" },
      "TikTok/Douyin": { icon: FaTiktok, color: "#000000" },
      "Douyin": { icon: FaTiktok, color: "#000000" },
      "X (Twitter)": { icon: FaTwitter, color: "#000000" },
      "Twitter": { icon: FaTwitter, color: "#1DA1F2" },
      "X": { icon: FaTwitter, color: "#000000" },
      "LinkedIn": { icon: FaLinkedin, color: "#0077B5" },
      "Snapchat": { icon: FaSnapchat, color: "#FFFC00" },
      "Pinterest": { icon: FaPinterest, color: "#E60023" },
      "Reddit": { icon: FaReddit, color: "#FF4500" },
      "Discord": { icon: FaDiscord, color: "#5865F2" },
      "WeChat": { icon: FaWeixin, color: "#07C160" },
      "Viber": { icon: SiViber, color: "#665CAC" },
      "Line": { icon: SiLine, color: "#00C300" },
      "KakaoTalk": { icon: SiKakaotalk, color: "#FFCD00" },

      // E-commerce
      "Amazon": { icon: FaAmazon, color: "#FF9900" },
      "eBay": { icon: FaEbay, color: "#E53238" },
      "Alibaba": { icon: SiAlibabadotcom, color: "#FF6A00" },
      "AliExpress": { icon: SiAliexpress, color: "#FF6A00" },
      "Alipay/Alibaba/1688": { icon: SiAlipay, color: "#1677FF" },
      "Alipay": { icon: SiAlipay, color: "#1677FF" },
      "Shopify": { icon: FaShopify, color: "#95BF47" },
      "Walmart": { icon: SiWalmart, color: "#0071CE" },
      "Target": { icon: SiTarget, color: "#CC0000" },
      "IKEA": { icon: SiIkea, color: "#0051BA" },

      // Finance & Banking
      "PayPal": { icon: FaPaypal, color: "#003087" },
      "Venmo": { icon: SiVenmo, color: "#3D95CE" },
      "Cash App": { icon: SiCashapp, color: "#00D64B" },
      "Zelle": { icon: SiZelle, color: "#6D1E6E" },
      "Chase": { icon: SiChase, color: "#0066CC" },
      "Bank of America": { icon: SiBankofamerica, color: "#012169" },
      "Wells Fargo": { icon: SiWellsfargo, color: "#EB0029" },
      "Citibank": { icon: null, color: "#003A6C" },
      "Capital One": { icon: null, color: "#004F9F" },
      "American Express": { icon: SiAmericanexpress, color: "#006FCF" },
      "Visa": { icon: FaCcVisa, color: "#1A1F71" },
      "Mastercard": { icon: FaCcMastercard, color: "#EB001B" },
      "Revolut": { icon: SiRevolut, color: "#996DFF" },
      "Wise": { icon: SiWise, color: "#6B3391" },
      "Coinbase": { icon: SiCoinbase, color: "#0052FF" },
      "Binance": { icon: SiBinance, color: "#F3BA2F" },
      "Bitcoin": { icon: FaBitcoin, color: "#F7931A" },
      "Ethereum": { icon: FaEthereum, color: "#627EEA" },

      // Tech & Software
      "Google": { icon: FcGoogle, color: "#4285F4" },
      "Google/YouTube/Gmail": { icon: FcGoogle, color: "#4285F4" },
      "Gmail": { icon: FcGoogle, color: "#4285F4" },
      "YouTube": { icon: FaYoutube, color: "#FF0000" },
      "Microsoft": { icon: FaMicrosoft, color: "#00A4EF" },
      "Apple": { icon: FaApple, color: "#000000" },
      "Adobe": { icon: null, color: "#FF0000" },
      "Zoom": { icon: SiZoom, color: "#2D8CFF" },
      "Slack": { icon: SiSlack, color: "#4A154B" },
      "Microsoft Teams": { icon: SiTeamspeak, color: "#5B5FC7" },
      "Dropbox": { icon: FaDropbox, color: "#0061FF" },
      "GitHub": { icon: FaGithub, color: "#181717" },

      // Gaming
      "Steam": { icon: FaSteam, color: "#1B2838" },
      "Epic Games": { icon: SiEpicgames, color: "#313131" },
      "PlayStation": { icon: FaPlaystation, color: "#003791" },
      "Xbox": { icon: FaXbox, color: "#107C10" },
      "Nintendo": { icon: SiNintendo, color: "#E60012" },
      "Roblox": { icon: SiRoblox, color: "#0082FF" },
      "Minecraft": { icon: null, color: "#62BDA0" },

      // Streaming & Entertainment
      "Netflix": { icon: SiNetflix, color: "#E50914" },
      "Disney+": { icon: null, color: "#113CCF" },
      "Hulu": { icon: null, color: "#1CE783" },
      "HBO Max": { icon: SiHbo, color: "#B535F5" },
      "Amazon Prime Video": { icon: FaAmazon, color: "#FF9900" },
      "Spotify": { icon: FaSpotify, color: "#1DB954" },
      "Apple Music": { icon: SiApplemusic, color: "#FA243C" },
      "Pandora": { icon: SiPandora, color: "#0054B0" },
      "Tidal": { icon: SiTidal, color: "#000000" },
      "Audible": { icon: SiAudible, color: "#F79E44" },

      // Travel
      "Uber": { icon: FaUber, color: "#000000" },
      "Lyft": { icon: SiLyft, color: "#FF00BF" },
      "Airbnb": { icon: FaAirbnb, color: "#FF5A5F" },
      "Booking.com": { icon: null, color: "#003580" },
      "Expedia": { icon: SiExpedia, color: "#2E6BBF" },
      "Kayak": { icon: null, color: "#003580" },
      "Skyscanner": { icon: null, color: "#0770E3" },
      "TripAdvisor": { icon: SiTripadvisor, color: "#00AF87" },

      // Shopping & Retail
      "Nike": { icon: null, color: "#111111" },
      "Adidas": { icon: SiAdidas, color: "#000000" },
      "Puma": { icon: SiPuma, color: "#C8102E" },
      "Sephora": { icon: null, color: "#000000" },
      "CVS": { icon: null, color: "#CC0000" },
      "Walgreens": { icon: null, color: "#0B3B6F" },

      // Other Popular Services
      "Grindr": { icon: null, color: "#0088FF" },
    };

    // Try exact match first
    if (iconMap[serviceName]) {
      return iconMap[serviceName];
    }

    // Try partial match
    for (const [key, entry] of Object.entries(iconMap)) {
      if (serviceName.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(serviceName.toLowerCase())) {
        return entry;
      }
    }

    // Default icon - return a generic icon or null
    return { icon: null, color: "#6B7280" };
  };

  const getFallbackEmoji = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("bank") || lowerName.includes("pay") || lowerName.includes("money")) return "💰";
    if (lowerName.includes("shop") || lowerName.includes("store") || lowerName.includes("market")) return "🛒";
    if (lowerName.includes("food") || lowerName.includes("delivery")) return "🍔";
    if (lowerName.includes("game") || lowerName.includes("play")) return "🎮";
    if (lowerName.includes("travel") || lowerName.includes("hotel")) return "✈️";
    if (lowerName.includes("music") || lowerName.includes("radio")) return "🎶";
    if (lowerName.includes("video") || lowerName.includes("tv")) return "📺";
    if (lowerName.includes("social") || lowerName.includes("chat")) return "💬";
    return "📱";
  };

  const { icon: IconComponent, color } = getIconAndColor(serviceName, serviceCode);

  if (IconComponent) {
    return (
      <span className={className} style={{ color }}>
        <IconComponent size={size} />
      </span>
    );
  }

  // Fallback to emoji
  return (
    <span
      className={`${className}`}
      style={{ fontSize: `${size}px`, lineHeight: 1, color }}
    >
      {getFallbackEmoji(serviceName)}
    </span>
  );
}
