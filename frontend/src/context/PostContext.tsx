import React, { createContext, useContext, useState, useCallback } from "react";

interface Post {
  id: number;
  text: string;
  color: string;
  createdAt: string;
  student_id?: number;
  x_axis?: number;
  y_axis?: number;
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
  updatePost: (sticky_id: number, updates: Partial<Post>) => Promise<void>;
  deletePost: (sticky_id: number) => Promise<void>;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export const PostProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [posts, setPosts] = useState<Post[]>([]);

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
        }));
        setPosts(formattedPosts);
      }
    } catch (error) {
      console.error("Failed to load posts:", error);
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
          const result = await response.json();
          const newPost: Post = {
            id: result.sticky_id,
            text: post.text,
            color: post.color,
            createdAt: new Date().toISOString(),
            student_id: post.student_id,
            x_axis: 0,
            y_axis: 0,
          };
          setPosts((prev) => [...prev, newPost]);
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
          setPosts((prev) =>
            prev.map((post) =>
              post.id === sticky_id ? { ...post, ...updates } : post
            )
          );
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
        setPosts((prev) => prev.filter((post) => post.id !== sticky_id));
      } else {
        console.error("付箋の削除に失敗しました");
      }
    } catch (error) {
      console.error("付箋の削除に失敗しました:", error);
    }
  }, []);

  return (
    <PostContext.Provider
      value={{ posts, addPost, loadPosts, updatePost, deletePost }}
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
