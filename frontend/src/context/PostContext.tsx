import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";

interface Post {
  id: number;
  text: string;
  color: string;
  createdAt: string;
  student_id?: number;
  x_axis?: number;
  y_axis?: number;
  student_name?: string;
}

interface StickyResponse {
  sticky_id: number;
  student_id: number;
  sticky_content: string;
  sticky_color: string;
  x_axis: number;
  y_axis: number;
  feedback_A: number;
  feedback_B: number;
  feedback_C: number;
  created_at: string;
  student_name: string;
}

interface UpdateData {
  sticky_content?: string;
  sticky_color?: string;
  x_axis?: number;
  y_axis?: number;
}

interface PostContextType {
  posts: Post[];
  addPost: (post: {
    text: string;
    color: string;
    student_id: number;
  }) => Promise<void>;
  loadPosts: (student_id?: number) => Promise<void>;
  loadSchoolPosts: (school_id: string) => Promise<void>;
  updatePost: (sticky_id: number, updates: Partial<Post>) => Promise<void>;
  deletePost: (sticky_id: number) => Promise<void>;
  connectSocket: (school_id: string) => void;
  disconnectSocket: () => void;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export const PostProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const [currentSchoolId, setCurrentSchoolId] = useState<string | null>(null);

  const loadPosts = useCallback(async (student_id?: number) => {
    try {
      const url = student_id
        ? `http://localhost:5000/api/sticky?student_id=${student_id}`
        : "http://localhost:5000/api/sticky";

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const formattedPosts = data.map((item: StickyResponse) => ({
          id: item.sticky_id,
          text: item.sticky_content,
          color: item.sticky_color,
          createdAt: item.created_at,
          student_id: item.student_id,
          x_axis: item.x_axis,
          y_axis: item.y_axis,
          student_name: item.student_name,
        }));
        setPosts(formattedPosts);
      }
    } catch (error) {
      console.error("Failed to load posts:", error);
    }
  }, []);

  const loadSchoolPosts = useCallback(async (school_id: string) => {
    try {
      const url = `http://localhost:5000/api/sticky?school_id=${school_id}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const formattedPosts = data.map((item: StickyResponse) => ({
          id: item.sticky_id,
          text: item.sticky_content,
          color: item.sticky_color,
          createdAt: item.created_at,
          student_id: item.student_id,
          x_axis: item.x_axis,
          y_axis: item.y_axis,
          student_name: item.student_name,
        }));
        setPosts(formattedPosts);
      }
    } catch (error) {
      console.error("Failed to load school posts:", error);
    }
  }, []);

  const addPost = useCallback(
    async (post: { text: string; color: string; student_id: number }) => {
      try {
        const response = await fetch("http://localhost:5000/api/sticky", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            student_id: post.student_id,
            sticky_content: post.text,
            sticky_color: post.color,
          }),
        });

        if (response.ok) {
          // Socket事件が新しい付箋を自動的に追加するため、ここでは何もしない
          console.log("付箋が正常に作成されました");
        } else {
          console.error("付箋の作成に失敗しました");
        }
      } catch (error) {
        console.error("付箋の作成に失敗しました:", error);
      }
    },
    []
  );

  const updatePost = useCallback(
    async (sticky_id: number, updates: Partial<Post>) => {
      try {
        const updateData: UpdateData = {};
        if (updates.text !== undefined)
          updateData.sticky_content = updates.text;
        if (updates.color !== undefined)
          updateData.sticky_color = updates.color;
        if (updates.x_axis !== undefined) updateData.x_axis = updates.x_axis;
        if (updates.y_axis !== undefined) updateData.y_axis = updates.y_axis;

        const response = await fetch(
          `http://localhost:5000/api/sticky/${sticky_id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updateData),
          }
        );

        if (response.ok) {
          // Socket事件が更新された付箋を自動的に同期するため、ここでは何もしない
          // console.log("付箋が正常に更新されました");
        } else {
          console.error("付箋の更新に失敗しました");
        }
      } catch (error) {
        console.error("付箋の更新に失敗しました:", error);
      }
    },
    []
  );

  const deletePost = useCallback(async (sticky_id: number) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/sticky/${sticky_id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Socket事件が削除された付箋を自動的に同期するため、ここでは何もしない
        console.log("付箋が正常に削除されました");
      } else {
        console.error("付箋の削除に失敗しました");
      }
    } catch (error) {
      console.error("付箋の削除に失敗しました:", error);
    }
  }, []);

  // Socket.IO関連の関数
  const connectSocket = useCallback((school_id: string) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    socketRef.current = io("http://localhost:5000");
    setCurrentSchoolId(school_id);

    socketRef.current.on("connect", () => {
      console.log("Socket connected");
      // 学校のルームに参加
      socketRef.current?.emit("join_school", { school_id });
    });

    socketRef.current.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    // 新しい付箋が作成された時
    socketRef.current.on("sticky_created", (data: StickyResponse) => {
      const newPost: Post = {
        id: data.sticky_id,
        text: data.sticky_content,
        color: data.sticky_color,
        createdAt: data.created_at,
        student_id: data.student_id,
        x_axis: data.x_axis,
        y_axis: data.y_axis,
        student_name: data.student_name,
      };
      setPosts((prev) => [...prev, newPost]);
    });

    // 付箋が更新された時
    socketRef.current.on("sticky_updated", (data: StickyResponse) => {
      const updatedPost: Post = {
        id: data.sticky_id,
        text: data.sticky_content,
        color: data.sticky_color,
        createdAt: data.created_at,
        student_id: data.student_id,
        x_axis: data.x_axis,
        y_axis: data.y_axis,
        student_name: data.student_name,
      };
      setPosts((prev) =>
        prev.map((post) => (post.id === data.sticky_id ? updatedPost : post))
      );
    });

    // 付箋が削除された時
    socketRef.current.on("sticky_deleted", (data: { sticky_id: number }) => {
      setPosts((prev) => prev.filter((post) => post.id !== data.sticky_id));
    });
  }, []);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      if (currentSchoolId) {
        socketRef.current.emit("leave_school", { school_id: currentSchoolId });
      }
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setCurrentSchoolId(null);
  }, [currentSchoolId]);

  // コンポーネントのアンマウント時にSocket接続を切断
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, [disconnectSocket]);

  return (
    <PostContext.Provider
      value={{
        posts,
        addPost,
        loadPosts,
        loadSchoolPosts,
        updatePost,
        deletePost,
        connectSocket,
        disconnectSocket,
      }}
    >
      {children}
    </PostContext.Provider>
  );
};

export const usePost = () => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error("PostProvider内でusePostを使用してください");
  }
  return context;
};
