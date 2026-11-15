
/* Chand Learning AI Service */

(function () {
  const SUPABASE_URL = "https://wkpbfihymdcoivuvozvh.supabase.co";
  const SUPABASE_KEY = "sb_publishable_CCjXcQ1dA4yh-0vqxyDzfg_RDgJD2AR";

  let client;
  let conversation = [];

  function getClient() {
    if (!client) {
      client = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );
    }
    return client;
  }

  function cleanAnswer(text) {
    return String(text || "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .trim();
  }

  async function send(message) {
    const text = String(message || "").trim();

    if (!text) {
      throw new Error("Please enter a message.");
    }

    const { data, error } =
      await getClient().functions.invoke("dynamic-handler", {
        body: {
          message: text,
          history: conversation.slice(-12)
        }
      });

    if (error) throw error;
    if (!data || !data.reply) {
      throw new Error("No AI response received.");
    }

    const reply = cleanAnswer(data.reply);

    conversation.push(
      { role: "user", content: text },
      { role: "assistant", content: reply }
    );

    return reply;
  }

  function resetConversation() {
    conversation = [];
  }

  window.ChandAIService = {
    send,
    resetConversation,
    cleanAnswer
  };
})();
