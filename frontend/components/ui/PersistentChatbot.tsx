"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const ChatbotWidget = dynamic(() => import("./ChatbotWidget"), { ssr: false });

const HIDDEN_PATHS = ["/", "/anaf-simulator"];

export default function PersistentChatbot() {
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setModalOpen(document.body.classList.contains("modal-open"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const hidden = HIDDEN_PATHS.includes(pathname) || pathname.startsWith("/auth/");
  if (hidden) return null;

  return (
    <div className={modalOpen ? "invisible pointer-events-none" : ""}>
      <ChatbotWidget />
    </div>
  );
}
