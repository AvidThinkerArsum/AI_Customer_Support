'use client'
import { Box, Stack, TextField, Button } from "@mui/material";
import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi, I'm the Virtual Assistant for British Airways. What can I help you with today?`,
    },
  ]);

  const [message, setMessage] = useState("");

  const processText = async (reader, decoder) => {
    let result = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value || new Int8Array(), { stream: true });

      setMessages((messages) => {
        let lastMessage = messages[messages.length - 1];
        let otherMessages = messages.slice(0, messages.length - 1);
        return [
          ...otherMessages,
          {
            ...lastMessage,
            content: lastMessage.content + text,
          },
        ];
      });

      result += text;
    }
    return result;
  };

  const sendMessage = async () => {
    setMessage("");
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);
  
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: message }],
        }),
      });
  
      // ✅ Step 1: Handle Errors Before Proceeding
      if (!response.ok) {
        console.error("API Error:", response.status, response.statusText);
        setMessages((messages) => [
          ...messages,
          { role: "assistant", content: "Sorry, there was an error processing your request." },
        ]);
        return;
      }
  
      // ✅ Step 2: Handle Streaming Response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
  
        const chunk = decoder.decode(value, { stream: true });
        assistantMessage += chunk;
  
        // ✅ Update UI with streamed response
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            {
              ...lastMessage,
              content: assistantMessage,
            },
          ];
        });
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setMessages((messages) => [
        ...messages,
        { role: "assistant", content: "Network error. Please try again." },
      ]);
    }
  };
  
  

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      sx={{ backgroundColor: "white" }} // ✅ Set background to white
    >
      <Stack
        direction="column"
        width="600px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={3}
        sx={{ backgroundColor: "white" }} // ✅ Ensures chat container is white
      >
        <Stack
          direction="column"
          spacing={2}
          flexGrow={1} // ✅ Fixed "flexglow" typo
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === "assistant" ? "flex-start" : "flex-end"
              }
            >
              <Box
                bgcolor={
                  message.role === "assistant" ? "primary.main" : "secondary.main"
                }
                color="white"
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField
            label="message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)} // ✅ Fixed "OnCalue" typo
          />
          <Button variant="contained" onClick={sendMessage}>
            Send
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
