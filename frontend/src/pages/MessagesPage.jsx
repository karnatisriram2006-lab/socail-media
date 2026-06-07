import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MessageCircle } from "lucide-react";
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
      const conv = await createConversation(profile._id);
      setSearchTerm("");
      navigate(`/messages/${conv._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    if (value) searchUsers(value);
  };

  const handleSendMessage = async (convId, payload) => {
    try {
      await sendMessage(convId, payload);
      emitTyping(convId, "stop");
    } catch (err) {
      console.error(err);
    }
  };

  const handleTyping = (action) => {
    if (!conversationId) return;
    emitTyping(conversationId, action);
  };

  // On mobile: if we have a conversation selected, hide sidebar
  const showSidebar = !conversationId;
  const showChat = !!conversationId;

  return (
    <div className="h-[calc(100vh-70px)] lg:h-[calc(100vh-70px)] flex">
      {/* Left sidebar - 30% on desktop, full on mobile */}
      <div
        className={`${
          showChat ? "hidden lg:flex" : "flex"
        } w-full lg:w-[380px] xl:w-[400px] shrink-0 flex-col`}
      >
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
      </div>

      {/* Right chat area - 70% on desktop */}
      <div
        className={`${
          showSidebar && !conversationId ? "hidden lg:flex" : "flex"
        } flex-1 flex-col min-w-0 bg-[#F5F5F7]`}
      >
        {!hasInitialized ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading messages...</p>
            </div>
          </div>
        ) : !activeConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center text-center max-w-sm">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Your messages</h2>
              <p className="text-sm text-gray-500 mt-2">
                Select a conversation or start a new one
              </p>
            </div>
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
          <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}