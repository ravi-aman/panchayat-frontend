import { Video, BarChart, Camera } from 'lucide-react';
import CreatePostModal from '../../components/dashboard/socialFeed/createNewPost';
import MediaEditorModal from '../../components/dashboard/socialFeed/MediaEditorModal';
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Comment, getUserFullName, Post, SuggestionUser, User } from '../../types/types';
import { useToast } from '../../contexts/toast/toastContext';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'icon';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface UserCardProps {
  user: User | SuggestionUser;
  compact?: boolean;
  timeAgo?: Date | string;
  actionButton?: React.ReactNode;
}

interface PostCardProps {
  post: Post;
  index: number;
  currentUser: User | null;
  handleInteract: Function;
  setSelectedPost: Function;
}

interface CreatePostProps {
  currentUser: User;
  setPosts: Function;
}

interface SidebarProps {
  suggestedUsers: SuggestionUser[];
  handleFollow: Function;
}

const Button: React.FC<ButtonProps> = ({ variant = 'icon', children, className = '', onClick }) => {
  const baseStyles = 'flex items-center';
  const variantStyles = {
    primary: 'bg-blue-500 text-white rounded-md',
    secondary: 'border border-gray-300 text-blue-500 rounded-md',
    icon: 'text-gray-500',
  };

  return (
    <motion.button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.button>
  );
};

const UserCard: React.FC<UserCardProps> = ({ user, compact = false, timeAgo, actionButton }) => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  return (
    <motion.div
      className="flex items-center justify-between w-full gap-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center w-full">
        <motion.img
          src={user.photo || '/logo.png'}
          alt={getUserFullName(user)}
          className={compact ? 'w-10 h-10 rounded-full' : 'w-12 h-12 rounded-full'}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
        />
        <div className={`flex flex-col justify-between w-full ${compact ? 'ml-2' : 'ml-3'}`}>
          <h3 className="font-semibold">{getUserFullName(user)}</h3>
          <p className="text-gray-500 text-sm flex max-sm:flex-col justify-between">
            @{getUserFullName(user)}
            {timeAgo ? <p>{`${timeAgo.toLocaleString('en-US', options)}`}</p> : ''}
          </p>
        </div>
      </div>
      {actionButton}
    </motion.div>
  );
};

//@ts-ignore
const CreatePost: React.FC<CreatePostProps> = ({ currentUser, setPosts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startWithPoll, setStartWithPoll] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorAccept, setEditorAccept] = useState<string>('image/*');
  const [initialMediaFiles, setInitialMediaFiles] = useState<File[] | undefined>(undefined);

  const openModal = (poll = false) => {
    setStartWithPoll(poll);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setStartWithPoll(false);
  };

  const openEditor = (accept: string = 'image/*') => {
    setEditorAccept(accept);
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
  };

  const handleEditorNext = (orderedFiles: File[]) => {
    // store files and close editor, then open the create post modal with those files
    setInitialMediaFiles(orderedFiles);
    setIsEditorOpen(false);
    setStartWithPoll(false);
    setIsModalOpen(true);
  };

  return (
    <>
      <motion.div
        className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden border border-gray-100"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#255df7]/5 to-purple-50 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <motion.img
                src={currentUser?.photo || '/logo.png'}
                alt="Profile"
                className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              />
              {/* <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#255df7] rounded-full flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div> */}
            </div>
            <motion.button
              onClick={() => openModal()}
              className="flex-1 p-4 bg-gray-50 rounded-xl text-left text-gray-500 hover:bg-white hover:shadow-sm transition-all duration-200 border border-transparent hover:border-[#255df7]/20 focus:outline-none focus:ring-2 focus:ring-[#255df7]/20"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <span className="text-gray-600">{`What's on your mind, ${getUserFullName(currentUser)}?`}</span>
            </motion.button>
          </div>
        </div>

        {/* Action Buttons */}
        <motion.div
          className="px-6 py-4 bg-gray-50/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={() => openEditor('image/*')}
              className="flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl hover:bg-[#255df7]/10 transition-all duration-200 group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Camera className="h-5 w-5 text-gray-500 group-hover:text-[#255df7] transition-colors" />
              <span className="font-medium text-gray-600 group-hover:text-[#255df7] transition-colors">
                Photo
              </span>
            </motion.button>

            <motion.button
              onClick={() => openEditor('video/*')}
              className="flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl hover:bg-red-50 transition-all duration-200 group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Video className="h-5 w-5 text-gray-500 group-hover:text-red-500 transition-colors" />
              <span className="font-medium text-gray-600 group-hover:text-red-500 transition-colors">
                Video
              </span>
            </motion.button>

            <motion.button
              onClick={() => openModal(true)}
              className="flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl hover:bg-purple-50 transition-all duration-200 group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <BarChart className="h-5 w-5 text-gray-500 group-hover:text-purple-500 transition-colors" />
              <span className="font-medium text-gray-600 group-hover:text-purple-500 transition-colors">
                Poll
              </span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
      {isEditorOpen && (
        <React.Suspense
          fallback={
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6">Loading...</div>
            </div>
          }
        >
          <MediaEditorModal
            isOpen={isEditorOpen}
            accept={editorAccept}
            onClose={closeEditor}
            onNext={handleEditorNext}
          />
        </React.Suspense>
      )}

      {isModalOpen && (
        <CreatePostModal
          currentUser={currentUser}
          setPosts={setPosts}
          onClose={closeModal}
          startWithPoll={startWithPoll}
          initialMediaFiles={initialMediaFiles}
        />
      )}
    </>
  );
};

//@ts-ignore
const PostCard: React.FC<PostCardProps> = ({
  post,
  index,
  currentUser,
  handleInteract,
  setSelectedPost,
}) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const actionButtons = (
    <div className="flex">
      {/* <Button onClick={() => handleFollow(post.author)} variant="primary" className="px-4 py-1 mr-2 cursor-pointer">
                Follow
            </Button> */}
      {/* <Button variant="secondary" className="px-4 py-1 mr-2">
                Message
            </Button>
            <Button>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
            </Button> */}
    </div>
  );

  useEffect(() => {
    const validatedUrls = new Map<string, string>();

    function isS3UrlExpired(url: string): boolean {
      try {
        const parsedUrl = new URL(url);
        const amzDate = parsedUrl.searchParams.get('X-Amz-Date');
        const expiresIn = parsedUrl.searchParams.get('X-Amz-Expires');

        if (!amzDate || !expiresIn) {
          console.error('Missing X-Amz-Date or X-Amz-Expires in URL');
          return true;
        }
        const dateTime = `${amzDate.slice(0, 4)}-${amzDate.slice(
          4,
          6,
        )}-${amzDate.slice(6, 8)}T${amzDate.slice(9, 11)}:${amzDate.slice(
          11,
          13,
        )}:${amzDate.slice(13, 15)}Z`;
        const signedTime = new Date(dateTime).getTime();

        if (isNaN(signedTime)) {
          console.error('Invalid X-Amz-Date format');
          return true;
        }

        const expirationTime = signedTime + parseInt(expiresIn, 10) * 1000;

        return Date.now() > expirationTime;
      } catch (error) {
        console.error('Error checking URL expiration:', error);
        return true;
      }
    }

    const fetchImages = async () => {
      if (!post.image?.url || !post.image?.url.includes('uploads/Post')) {
        return;
      }
      if (validatedUrls.has(post.image.key)) {
        setPhoto(validatedUrls.get(post.image.key)!);
        return;
      }

      try {
        if (isS3UrlExpired(post.image.url)) {
          const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/file/geturl`, {
            params: { key: post.image.key },
          });

          if (res.data.status === 'success') {
            const newUrl = res.data.url;
            setPhoto(newUrl);
            validatedUrls.set(post.image.key, newUrl);
            await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/v1/post/images`, {
              postId: post._id,
              imageUrl: newUrl,
            });
          }
        } else {
          setPhoto(post.image.url);
          validatedUrls.set(post.image.key, post.image.url);
        }
      } catch (error) {
        console.error('Failed to fetch images:', error);
      }
    };

    fetchImages();
  }, [post._id, post.image]);

  return (
    <motion.div
      className="bg-white rounded-lg shadow mb-4"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.15,
        type: 'spring',
        stiffness: 100,
      }}
      whileHover={{ y: -5, boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.1)' }}
    >
      <div className="p-4">
        <div className="mb-4">
          <UserCard
            user={post.author}
            timeAgo={post.createdAt ? new Date(post.createdAt) : ''}
            actionButton={actionButtons}
          />
        </div>

        <p className="mb-4">{post.content}</p>

        {post.image && post.image.url && (
          <motion.div
            className="rounded-lg overflow-hidden mb-4 flex justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.05, duration: 0.4 }}
            whileHover={{ scale: 1.02 }}
          >
            {post.image.url && post.image.url.endsWith('.pdf') ? (
              <a
                href={post.image.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                View PDF
              </a>
            ) : (
              <img src={photo || ''} alt="Post" className="w-fit max-h-[400px]" />
            )}
          </motion.div>
        )}

        <motion.div
          className="flex items-center text-gray-500"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + index * 0.05, duration: 0.3 }}
        >
          <Button
            onClick={() => {
              if (!currentUser) {
                window.location.href = '/auth/signin';
                return;
              }
              handleInteract({ currentUser, postId: post._id });
            }}
            className="mr-6 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-1 text-blue-500"
              fill={
                currentUser && post.likes.some((e) => e._id === currentUser._id)
                  ? 'currentColor'
                  : 'none'
              }
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            {post.likes.length || 0}
          </Button>
          <Button
            onClick={() => {
              if (!currentUser) {
                window.location.href = '/auth/signin';
                return;
              }
              setSelectedPost(post);
            }}
            className="mr-6 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-1 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {(post.comments || []).length}
          </Button>
          {/* <Button className="mr-6 cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    </Button> */}
          {/* <Button className="ml-auto cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                    </Button> */}
        </motion.div>
      </div>
    </motion.div>
  );
};

//@ts-ignore
const Sidebar: React.FC<SidebarProps> = ({ suggestedUsers, handleFollow }) => {
  return (
    <motion.div
      className="hidden md:block w-1/3 p-4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* <motion.div
        className="bg-white rounded-lg shadow mb-4 p-3"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -5, boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)' }}
      >
        <div className="flex items-center text-gray-500 border border-gray-400 rounded-lg px-3 py-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <motion.input
            type="text"
            placeholder="Search users..."
            className="w-full bg-transparent outline-none border-gray-200"
            whileFocus={{ scale: 1.02 }}
          />
        </div>
      </motion.div> */}

      <motion.div
        className="bg-white rounded-lg shadow p-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        whileHover={{ y: -5, boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.1)' }}
      >
        <h3 className="font-semibold text-lg mb-4">Expand your network</h3>

        {suggestedUsers.slice(0, 4).map((user, index) => (
          <motion.div
            key={user._id}
            className="mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.3,
              delay: 0.5 + index * 0.1,
            }}
          >
            <UserCard
              user={user}
              compact={true}
              actionButton={
                !user.isFollower ? (
                  <Button
                    onClick={() => handleFollow(user._id, true)}
                    variant="primary"
                    className="px-3 py-1 text-sm cursor-pointer"
                  >
                    Follow
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleFollow(user._id, false)}
                    variant="primary"
                    className="px-3 py-1 text-sm cursor-pointer"
                  >
                    Unfollow
                  </Button>
                )
              }
            />
          </motion.div>
        ))}

        <div className="flex justify-center mt-4">
          <Button
            variant="primary"
            className="w-full py-2 font-medium justify-center"
            onClick={() => {
              window.location.href = '/dashboard/connections';
            }}
          >
            Connect with more people
          </Button>
        </div>
        {/* 
                <motion.div
                    className="mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.3 }}
                >
                    <motion.a
                        href="#"
                        className="text-blue-500 flex items-center text-sm"
                        whileHover={{ x: 5, color: "#3B82F6" }}
                        transition={{ duration: 0.2 }}
                    >
                        Discover more
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </motion.a>
                </motion.div> */}

        {/* <motion.div
                    className="mt-6 space-y-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.4 }}
                >
                    <Button variant="secondary" className="w-full py-2 font-medium justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Join a team
                    </Button>
                    <Button variant="primary" className="w-full py-2 font-medium justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Find a team
                    </Button>
                </motion.div> */}
      </motion.div>
    </motion.div>
  );
};

const CommentPopup: React.FC<{
  post: Post;
  onClose: () => void;
  handleComment: (postId: string, comment: Comment) => void;
  currentUser: User;
}> = ({ post, onClose, handleComment, currentUser }) => {
  const [commentText, setCommentText] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);

  const handleSendComment = () => {
    if (currentUser == null) {
      window.location.href = '/auth/signin';
      return;
    }
    if (commentText.trim()) {
      handleComment(post._id, {
        user: currentUser,
        text: commentText,
      });
      setCommentText('');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 backdrop-blur-xs backdrop-brightness-50 bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-4"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        transition={{ duration: 0.3 }}
        ref={popupRef}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Comments</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 cursor-pointer hover:bg-gray-100 transition-all rounded-full p-1 px-2"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 flex w-full gap-2">
          <motion.img
            src={currentUser.photo}
            alt={getUserFullName(currentUser)}
            className="w-10 h-10 rounded-full"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div className="flex items-center w-full">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-md outline-none"
            />
            <button
              onClick={handleSendComment}
              className="ml-2 bg-blue-500 cursor-pointer text-white px-3 py-1 rounded-md h-full hover:bg-blue-600"
            >
              Send
            </button>
          </motion.div>
        </div>

        <div className="space-y-4 w-full max-h-[300px] overflow-y-auto p-5 border-t border-gray-400">
          {post.comments.map((comment, index) => (
            <div
              key={`${comment.user._id ?? 'unknown'}-${index}`}
              className="flex flex-col items-start gap-2"
            >
              <div className="flex gap-5">
                <img
                  src={comment.user.photo}
                  alt={comment.user.firstName}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h4 className="font-semibold text-gray-700">{getUserFullName(comment.user)}</h4>
                  <p className="text-gray-600">{comment.text}</p>
                </div>
              </div>
              <div className="w-full flex justify-end text-xs">
                {new Date(comment.user.createdAt as string).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

//@ts-ignore
const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  const [post, setPosts] = useState<Post[]>([]);
  const [suggestionUsers, setSuggestionUsers] = useState<SuggestionUser[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const toast = useToast();
  useEffect(() => {
    const getPosts = async () => {
      await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v2/posts`).then(({ data }) => {
        if (data.status) {
          setPosts(data.data.posts);
        }
      });
    };
    getPosts();
  }, []);

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      if (!isAuthenticated() || !user) return;

      try {
        const [suggestedUsersRes, currentUserRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user/getAll`),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user/${user._id}`),
        ]);

        if (suggestedUsersRes.data.status && currentUserRes.data.status === 'success') {
          const allUsers: SuggestionUser[] = suggestedUsersRes.data.users;
          const following: string[] = currentUserRes.data.user.following || [];

          const suggestions = allUsers
            .filter((suggestedUser) => suggestedUser._id !== user._id)
            .map((suggestedUser) => ({
              ...suggestedUser,
              isFollower: following.includes(suggestedUser._id),
            }));

          setSuggestionUsers(suggestions);
        }
      } catch (error) {
        console.error('Error fetching suggested users:', error);
      }
    };
    fetchSuggestedUsers();
  }, [user, isAuthenticated]);

  const handleInteract = async ({ currentUser, postId }: { currentUser: User; postId: string }) => {
    if (!isAuthenticated()) {
      window.location.href = '/auth/signin';
      return;
    }
    await axios
      .put(`${import.meta.env.VITE_BACKEND_URL}/api/v1/post/interact`, {
        postId,
        userId: currentUser._id,
      })
      .then((res) => {
        if (res.status == 200) {
          setPosts((prev) =>
            prev.map((post) => (post._id === postId ? { ...post, likes: res.data.updated } : post)),
          );
        }
      });
  };

  const handleFollow = async (followId: string, condition: Boolean) => {
    if (!isAuthenticated) {
      window.location.href = '/auth/signin';
      return;
    }
    if (condition) {
      await axios
        .put(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user/follow`, {
          userId: user!._id,
          followId,
        })
        .then(async (res) => {
          if (res.status === 200) {
            setSuggestionUsers((prev) =>
              prev.map((suggestedUser) =>
                suggestedUser._id === followId
                  ? { ...suggestedUser, isFollower: true }
                  : suggestedUser,
              ),
            );
          }
        })
        .catch(async (e: Error) => {
          console.log(e);
          toast.open({
            message: {
              heading: 'Already Followed',
              content: 'You are already following this user.',
            },
            duration: 5000,
            position: 'top-center',
            color: 'warning',
          });
        });
    } else {
      await axios
        .put(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user/unfollow`, {
          userId: user!._id,
          unfollowId: followId,
        })
        .then(async (res) => {
          if (res.status === 200) {
            setSuggestionUsers((prev) =>
              prev.map((suggestedUser) =>
                suggestedUser._id === followId
                  ? { ...suggestedUser, isFollower: false }
                  : suggestedUser,
              ),
            );
          }
        })
        .catch(async (e: Error) => {
          console.log(e);
          toast.open({
            message: {
              heading: 'Unfollow Failed',
              content: 'Could not unfollow the user. Please try again.',
            },
            duration: 5000,
            position: 'top-center',
            color: 'error',
          });
        });
    }
  };

  const handleComment = async (postId: string, comment: Comment) => {
    await axios
      .put(`${import.meta.env.VITE_BACKEND_URL}/api/v1/post/comment`, {
        postId,
        comment,
      })
      .then((res) => {
        if (res.status === 200) {
          setPosts((prev) =>
            prev.map((p) => (p._id === postId ? { ...p, comments: res.data.updated } : p)),
          );
          if (selectedPost && selectedPost._id === postId) {
            setSelectedPost((prev) => (prev ? { ...prev, comments: res.data.updated } : null));
          }
        }
      });
  };

  return (
    <motion.div
      className="flex min-h-screen w-full bg-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="flex-1 w-full mx-auto p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {isAuthenticated() && <CreatePost currentUser={user!} setPosts={setPosts} />}
        {post.length > 0 &&
          post.map((item: Post, index: number) => {
            return (
              <PostCard
                setSelectedPost={setSelectedPost}
                post={item}
                key={item._id}
                index={index}
                currentUser={user}
                handleInteract={handleInteract}
              />
            );
          })}
      </motion.div>
      {selectedPost && isAuthenticated() && (
        <CommentPopup
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          handleComment={handleComment}
          currentUser={user!}
        />
      )}
      <Sidebar suggestedUsers={suggestionUsers} handleFollow={handleFollow} />
    </motion.div>
  );
};

export default Dashboard;
