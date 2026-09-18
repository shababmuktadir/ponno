import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  watchAllConversations,
  watchMessages,
  watchConversation,
  sendMessage,
  markConversationRead,
} from "@/services/firebase/chatService";
import { getErrorMessage } from "@/utils/errors";
import toast from "react-hot-toast";

export default function useAdminChat() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  const listUnsub = useRef(null);
  const activeUnsub = useRef(null);
  const msgUnsub = useRef(null);

  /* ---------- Watch all conversations ---------- */
  useEffect(() => {
    listUnsub.current = watchAllConversations((list) => {
      setConversations(list);
      setLoading(false);
    });
    return () => {
      if (listUnsub.current) listUnsub.current();
    };
  }, []);

  /* ---------- Watch active conversation ---------- */
  useEffect(() => {
    if (activeUnsub.current) {
      activeUnsub.current();
      activeUnsub.current = null;
    }
    if (msgUnsub.current) {
      msgUnsub.current();
      msgUnsub.current = null;
    }
    if (!activeId) {
      setActive(null);
      setMessages([]);
      return;
    }

    activeUnsub.current = watchConversation(activeId, (conv) => {
      setActive(conv);
    });

    msgUnsub.current = watchMessages(activeId, (list) => {
      setMessages(list);
      // Mark read for staff
      markConversationRead(activeId, "staff");
    });

    return () => {
      if (activeUnsub.current) activeUnsub.current();
      if (msgUnsub.current) msgUnsub.current();
    };
  }, [activeId]);

  /* ---------- Send ---------- */
  const send = useCallback(
    async (text) => {
      if (!activeId) throw new Error("চ্যাট নির্বাচন করুন");
      setSending(true);
      try {
        await sendMessage({
          convId: activeId,
          text,
          sender: {
            uid: profile.uid,
            name: profile.name || profile.email,
            role: profile.role || "admin",
          },
        });
      } catch (err) {
        toast.error(getErrorMessage(err));
        throw err;
      } finally {
        setSending(false);
      }
    },
    [activeId, profile]
  );

  const totalUnread = conversations.reduce(
    (sum, c) => sum + (c.unreadForStaff || 0),
    0
  );

  return {
    conversations,
    loading,
    activeId,
    setActiveId,
    active,
    messages,
    sending,
    send,
    totalUnread,
  };
}