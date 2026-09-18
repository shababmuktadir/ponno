import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  ensureUserConversation,
  watchConversation,
  watchMessages,
  sendMessage,
  markConversationRead,
} from "@/services/firebase/chatService";
import { getErrorMessage } from "@/utils/errors";
import toast from "react-hot-toast";

export default function useChat() {
  const { profile, isStaff } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const convUnsub = useRef(null);
  const msgUnsub = useRef(null);

  useEffect(() => {
    let cancelled = false;
    if (!profile?.uid || isStaff) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const conv = await ensureUserConversation({
          uid: profile.uid,
          name: profile.name,
          email: profile.email,
          workspaceId: profile.workspaceId,
        });
        if (!cancelled) setConversation(conv);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.uid, isStaff]);

  useEffect(() => {
    if (convUnsub.current) {
      convUnsub.current();
      convUnsub.current = null;
    }
    if (!conversation?.id) return;

    convUnsub.current = watchConversation(conversation.id, (updated) => {
      setConversation(updated);
    });
    return () => {
      if (convUnsub.current) {
        convUnsub.current();
        convUnsub.current = null;
      }
    };
  }, [conversation?.id]);

  useEffect(() => {
    if (msgUnsub.current) {
      msgUnsub.current();
      msgUnsub.current = null;
    }
    if (!conversation?.id) {
      setMessages([]);
      return;
    }

    msgUnsub.current = watchMessages(conversation.id, (list) => {
      setMessages(list);
    });
    return () => {
      if (msgUnsub.current) {
        msgUnsub.current();
        msgUnsub.current = null;
      }
    };
  }, [conversation?.id]);

  useEffect(() => {
    if (!conversation?.id || !messages.length) return;
    const last = messages[messages.length - 1];
    if (last.senderId === profile?.uid) return;
    markConversationRead(conversation.id, "user");
  }, [messages, conversation?.id, profile?.uid]);

  const send = useCallback(
    async (text) => {
      if (!conversation?.id) throw new Error("চ্যাট প্রস্তুত নয়");
      if (!text?.trim()) return;

      setSending(true);
      try {
        await sendMessage({
          convId: conversation.id,
          text,
          sender: {
            uid: profile.uid,
            name: profile.name,
            email: profile.email,
            role: profile.role || "user",
          },
        });
      } catch (err) {
        toast.error(getErrorMessage(err));
        throw err;
      } finally {
        setSending(false);
      }
    },
    [conversation?.id, profile]
  );

  return {
    conversation,
    messages,
    loading,
    sending,
    send,
    unread: conversation?.unreadForUser || 0,
  };
}