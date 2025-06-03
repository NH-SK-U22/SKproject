import React, { createContext, useContext, useState } from "react";

interface Post {
  id: number;
  text: string;
  color: string;
  createdAt: string;
}

interface PostContextType {
  posts: Post[];
  addPost: (post: { text: string; color: string }) => void;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export const PostProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [posts, setPosts] = useState<Post[]>([]);

  const addPost = (post: { text: string; color: string }) => {
    const newPost: Post = {
      id: Date.now(),
      text: post.text,
      color: post.color,
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) => [...prev, newPost]);
  };

  return (
    <PostContext.Provider value={{ posts, addPost }}>
      {children}
    </PostContext.Provider>
  );
};

export const usePost = () => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error("usePost must be used within a PostProvider");
  }
  return context;
};
