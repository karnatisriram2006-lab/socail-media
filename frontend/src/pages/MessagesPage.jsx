import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import ChatSidebar from "../components/chat/ChatSidebar";
import ChatWindow from "../components/chat/ChatWindow";

export default function MessagesPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    conversations,
    messages,
    currentConversationId,
    typingUsers,
    searchResults,
    loading,
    error,
    fetchConversations,
    createConversation,
    fetchMessages,
    searchUsers,
    sendMessage,
    markSeen,
    setCurrentConversation,
    joinConversation,
    leaveConversation,
    emitTyping,
  } = useChatStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    fetchConversations().finally(() => setHasInitialized(true));
  }, [fetchConversations]);

  useEffect(() => {
    const currentId = conversationId || currentConversationId;
    if (!currentId) return;

    setCurrentConversation(currentId);
    fetchMessages(currentId);
    joinConversation(currentId);

    return () => {
      leaveConversation(currentId);
    };
  }, [
    conversationId,
    currentConversationId,
    fetchMessages,
    joinConversation,
    leaveConversation,
    setCurrentConversation,
  ]);

  useEffect(() => {
    if (conversationId) {
      markSeen(conversationId);
    }
  }, [conversationId, markSeen]);

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conv) => conv._id === (conversationId || currentConversationId),
      ),
    [conversations, conversationId, currentConversationId],
  );

  const handleSelectConversation = (id) => {
    navigate(`/messages/${id}`);
  };

  const handleSelectUser = async (profile) => {
    try {
      const conversation = await createConversation(profile._id);
      setSearchTerm("");
      navigate(`/messages/${conversation._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchChange = async (value) => {
    setSearchTerm(value);
    searchUsers(value);
  };

  const handleSendMessage = async (conversationId, payload) => {
    try {
      await sendMessage(conversationId, payload);
      emitTyping(conversationId, "stop");
    } catch (err) {
      console.error(err);
    }
  };

  const handleTyping = (action) => {
    if (!conversationId) return;
    emitTyping(conversationId, action);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <ChatSidebar
        conversations={conversations}
        currentConversationId={conversationId || currentConversationId}
        onSelectConversation={handleSelectConversation}
        searchTerm={searchTerm}
        onChangeSearchTerm={handleSearchChange}
        onSearchUser={searchUsers}
        searchResults={searchResults}
        onSelectUser={handleSelectUser}
        isLoading={loading}
        typingUsers={typingUsers}
      />

      <div className="flex h-full flex-col gap-4">
        {!hasInitialized ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
            Loading messages…
          </div>
        ) : !activeConversation ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
            <p className="text-lg font-semibold text-slate-900">
              No conversation selected
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Search for a user and start a private conversation.
            </p>
          </div>
        ) : (
          <ChatWindow
            conversation={activeConversation}
            messages={messages}
            currentUserId={user?._id}
            typing={typingUsers[activeConversation._id]}
            onSend={handleSendMessage}
            onTyping={handleTyping}
            onBack={() => navigate("/messages")}
          />
        )}

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
