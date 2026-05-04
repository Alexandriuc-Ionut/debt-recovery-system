"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const ChatbotWidget = dynamic(() => import("./ChatbotWidget"), { ssr: false });

const HIDDEN_PATHS = ["/", "/anaf-simulator"];

export default function PersistentChatbot() {
  const pathname = usePathname();
  const [overlayOpen, setOverlayOpen] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setOverlayOpen(
        document.body.classList.contains("modal-open") ||
        document.body.classList.contains("sidebar-open")
      );
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const hiddenRoute = HIDDEN_PATHS.includes(pathname) || pathname.startsWith("/auth/");
  if (hiddenRoute) return null;

  return (
    <div className={overlayOpen ? "invisible pointer-events-none" : ""}>
      <ChatbotWidget />
    </div>
  );
}
