import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "axios";
import { Github, Settings, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import logo from "./assets/logo-waku.svg";

interface Message {
  payload: string;
  content_topic: string;
  timestamp: number;
}

interface Cursor {
  digest: {
    data: string;
  };
  sender_time: number;
  store_time: number;
  pubsub_topic: string;
}

interface ResponseData {
  messages: Message[];
  cursor?: Cursor;
}

interface MessageData {
  message: Message;
  message_hash: string;
}

interface CommunityMetadata {
  name: string;
  contentTopic: string;
}

const SERVICE_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || "http://localhost:8645";
const COMMUNITY_CONTENT_TOPIC_PREFIX = "/universal/1/community";

function App() {
  const [newMessage, setNewMessage] = useState("");
  const [username, setUsername] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [community, setCommunity] = useState<CommunityMetadata | undefined>(
    undefined
  );
  const [joinedCommunities, setJoinedCommunities] = useState<
    CommunityMetadata[]
  >([]);
  const [communityName, setCommunityName] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState(SERVICE_ENDPOINT);
  const [nwakuVersion, setNwakuVersion] = useState("");
  const [numPeers, setNumPeers] = useState("")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateMessage = (e: any) => setNewMessage(e.target.value);

  useEffect(() => {
    const name = GetUser();
    setUsername(name);

    const localCommunity = localStorage.getItem("community");
    console.log("current community", localCommunity);
    setCommunity(localCommunity ? JSON.parse(localCommunity) : undefined);

    const communities = localStorage.getItem("communities");
    if (communities) {
      const parsed = JSON.parse(communities);
      setJoinedCommunities(parsed);
      console.log("joined communities", parsed);
    }
  }, []);

  useEffect(() => {
    const fetchNwakuVersion = async () => {
      try {
        let url = `${apiEndpoint}/debug/v1/version`;
        const response = await axios.get(url);
        console.log("fetchNwakuVersion data:", response.data);
        setNwakuVersion(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    fetchNwakuVersion()

  }, [apiEndpoint]);

  useEffect(() => {
    const fetchAllMessages = async () => {
      try {
        const joinedContentTopics = joinedCommunities
          .map(
            (c: CommunityMetadata) =>
              `${COMMUNITY_CONTENT_TOPIC_PREFIX}/${c.contentTopic}`
          )
          .join(",");

        if (joinedContentTopics === "") {
          return;
        }

        let url = `${apiEndpoint}/store/v3/messages?contentTopics=${encodeURIComponent(joinedContentTopics)}&ascending=false&pageSize=300&includeData=true`;
        const response = await axios.get(url);
        console.log("Data:", response.data);

        const parsedResponse = response.data.messages.map((obj: MessageData) => obj.message);
        
        setMessages((prev) => {
          const filtered = parsedResponse.filter((msg: Message) => {
            const found = prev.find(
              (item) =>
                item.payload === msg.payload &&
                item.timestamp === msg.timestamp &&
                item.content_topic === msg.content_topic
            );
            return !found;
          });

          const result = [...prev, ...filtered].sort(
            (a: Message, b: Message) => b.timestamp - a.timestamp
          );
          return result;
        });

        handleCursor(url, response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const fetchNumPeers = async () => {
      try{
        let url = `${apiEndpoint}/admin/v1/peers`;
        const response = await axios.get(url);
        console.log("getNumPeers data:", response.data);
        setNumPeers(response.data.length)
        console.log(`there are ${response.data.length} peers`)
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    
    const handleCursor = async (baseUrl: string, data: ResponseData) => {
      if (data.cursor) {
        const url = `${baseUrl}&pubsubTopic=${data.cursor.pubsub_topic}&digest=${data.cursor.digest.data}&senderTime=${data.cursor.sender_time}&storeTime=${data.cursor.store_time}`;

        const response = await axios.get(url);
        setMessages((prev) => {
          const filtered = response.data.messages.filter((msg: Message) => {
            const found = prev.find(
              (item) =>
                item.payload === msg.payload &&
                item.timestamp === msg.timestamp &&
                item.content_topic === msg.content_topic
            );
            return !found;
          });

          const result = [...prev, ...filtered].sort(
            (a: Message, b: Message) => b.timestamp - a.timestamp
          );
          return result;
        });
        handleCursor(baseUrl, response.data);
      }
    };

    const intervalId = setInterval(fetchAllMessages, 2000); // Trigger fetchData every 2 seconds
    const intervalId2 = setInterval(fetchNumPeers, 10000); // Trigger fetchNumPeers every 10 seconds

    return () => {
      clearInterval(intervalId);
      clearInterval(intervalId2);
    }
  }, [joinedCommunities, apiEndpoint]);

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const CreateUser = async (name: string) => {
    console.log("creating user");
    localStorage.setItem("username", name);
    return name;
  };

  const GetUser = () => {
    const name = localStorage.getItem("username");
    return name || "";
  };

  const Send = async (content: string) => {
    console.log("sending message", content);
    const payload = {
      content: content,
      name: username,
      timestamp: Math.floor(Date.now() / 1000),
    };

    const bytes = btoa(JSON.stringify(payload));

    const message = {
      payload: bytes,
      contentTopic: `${COMMUNITY_CONTENT_TOPIC_PREFIX}/${
        community!.contentTopic
      }`,
    };
    const response = await axios.post(
      `${apiEndpoint}/relay/v1/auto/messages`,
      JSON.stringify(message),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  };

  const sendMessage = async () => {
    if (!username || !newMessage) {
      toast.warning("Username or message is empty.");
      return;
    }
    try {
      let result = await Send(newMessage);
      console.log("result", result);
      setNewMessage("");
    } catch (err) {
      toast.error(`Error happens: ${err}`);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checkForEnter = (e: any) => {
    if (e.key === 'Enter') {
      sendMessage()
    }
  }

  const createUser = async () => {
    try {
      const name = await CreateUser(usernameInput);
      setUsername(name);
      toast("User has been created.");
    } catch (err) {
      toast.error(`Error happens: ${err}`);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateCommunityName = (e: any) => setCommunityName(e.target.value);

  const createCommunity = (name: string) => {
    const metadata: CommunityMetadata = {
      name: name,
      contentTopic: name,
    };

    const communities = localStorage.getItem("communities");
    if (communities) {
      const parsed = JSON.parse(communities);
      if (parsed.find((item: CommunityMetadata) => item.name === name)) {
        toast.warning("Community already exists.");
        return;
      }
      parsed.push(metadata);
      localStorage.setItem("communities", JSON.stringify(parsed));
      setJoinedCommunities(parsed);
    } else {
      localStorage.setItem("communities", JSON.stringify([metadata]));
      setJoinedCommunities([metadata]);
    }

    setCommunity(metadata);
    localStorage.setItem("community", JSON.stringify(metadata));
    setCommunityName("");

    return metadata;
  };

  const deleteCommunity = (index: number) => () => {
    const communities = localStorage.getItem("communities");
    if (communities) {
      const parsed = JSON.parse(communities);
      parsed.splice(index, 1);
      localStorage.setItem("communities", JSON.stringify(parsed));
      setJoinedCommunities(parsed);
      console.log("delete community", parsed);
      setCommunity(undefined);
      localStorage.removeItem("community");
    }
  };

  const selectCommunity = (index: number) => {
    console.log("select community", joinedCommunities[index]);
    setCommunity(joinedCommunities[index]);
    localStorage.setItem("community", JSON.stringify(joinedCommunities[index]));
  };

  const decodeMsg = (index: number, msg: Message) => {
    try {
      if (
        msg.content_topic !==
        `${COMMUNITY_CONTENT_TOPIC_PREFIX}/${community?.contentTopic}`
      ) {
        return;
      }
      const formtMsg = JSON.parse(atob(msg.payload));

      return (
        <li key={index} className="mb-1">
          <div className="flex flex-row justify-between gap-2">
            <Label>
              <span
                className={
                  formtMsg.name == username ? "bg-green-200" : "bg-gray-300"
                }
              >
                {formtMsg.name}:
              </span>{" "}
              {formtMsg.content}
            </Label>
            <Label>{formatDate(formtMsg.timestamp)}</Label>
          </div>
        </li>
      );
    } catch (err) {
      console.log("decode message error", msg, err);
    }
  };

  const settingsDialog = () => {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Settings />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Make changes to your settings here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                REST API
              </Label>
              <Input
                id="name"
                onChange={(e) => setApiEndpoint(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                defaultValue={apiEndpoint}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="submit">
                Save
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const logoImage = () => {
    return (
      <img
        height={100}
        width={100}
        src={logo}
        alt="logo"
        className="rounded-2xl"
      />
    );
  };

  const createCommunityDialog = () => {
    return (
      <div className="flex flex-col items-center gap-3">
        <Input
          className="w-[200px]"
          value={communityName}
          onChange={updateCommunityName}
          placeholder="Input the community name"
          autoComplete="off"
          autoCorrect="off"
        />

        <Label className="text-gray-500">
          For example: <span className="underline">waku</span>
        </Label>

        <Button className="w-50" onClick={() => createCommunity(communityName)}>
          Join Community
        </Button>
      </div>
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  return (
    <div>
      <div className="absolute right-36 top-16">
        <Label className="text-md">Hello, {username}</Label>
      </div>

      <div className="absolute right-24 top-16">
        <a href="https://github.com/waku-org/waku-frontend" target="_blank">
          <Github />
        </a>
      </div>

      <div className="absolute right-16 top-16">{settingsDialog()}</div>

      {!username && (
        <div className="flex flex-col gap-5 items-center justify-center h-screen mt-[-60px]">
          {logoImage()}
          <div className="flex flex-col items-center gap-3">
            <Input
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Enter your username"
              autoComplete="off"
              autoCorrect="off"
            />
            <Button className="w-32" onClick={createUser}>
              Create
            </Button>
          </div>
        </div>
      )}

      {username && joinedCommunities.length == 0 && (
        <div className="flex flex-col gap-5 items-center justify-center h-screen mt-[-60px]">
          {logoImage()}
          {createCommunityDialog()}
        </div>
      )}

      {username && joinedCommunities.length > 0 && (
        <div className="flex md:flex-row flex-col h-screen items-center justify-center gap-10">
          <div className="flex flex-col gap-8 mt-36 md:mt-0">
            <div>
              <h1 className="text-xl font-bold mb-2">Communities</h1>
              <ul>
                {joinedCommunities.map((item, index) => (
                  <li key={index} onClick={() => selectCommunity(index)}>
                    <div className="flex flex-row items-center gap-1">
                      <Label
                        className={
                          item.name == community?.name ? "bg-green-200" : ""
                        }
                      >
                        {item.name}
                      </Label>
                      <X size={18} onClick={deleteCommunity(index)} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {createCommunityDialog()}
          </div>
          <div className="flex flex-col gap-10 items-center justify-center">
            {logoImage()}
            {community && (
              <div className="flex flex-col gap-10 items-center">
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <Input
                    value={newMessage}
                    onChange={updateMessage}
                    onKeyDown={checkForEnter}
                    placeholder="Input your message"
                    autoComplete="off"
                    autoCorrect="off"
                  />
                  <Button className="w-32" onClick={sendMessage}>
                    Send
                  </Button>
                </div>

                <div>
                  <h1 className="text-xl font-bold mb-2">Message History</h1>
                  <ScrollArea className="h-[300px] md:w-[650px] rounded-md border p-4 bg-gray-100">
                    <ul className="text-sm flex flex-col gap-1">
                      {messages.map((msg, index) => decodeMsg(index, msg))}
                    </ul>
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
