import { Video, BarChart, Camera, Calendar } from 'lucide-react';
import CreatePostModal from '../../components/dashboard/socialFeed/createNewPost';
import CreateEventPostModal from '../../components/dashboard/socialFeed/CreateEventPostModal';
import MediaEditorModal from '../../components/dashboard/socialFeed/MediaEditorModal';
import PollModal from '../../components/dashboard/socialFeed/PollModal';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { getUserFullName, SuggestionUser, User } from '../../types/types';
import { useToast } from '../../contexts/toast/toastContext';
// import api from '../../utils/api';
import PostService from '../../services/PostService';
import { IPost } from '../../types/postTypes';
import StandardPost from '../../components/dashboard/posts/standardPost';

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

interface CreatePostProps {
  currentUser: User;
  setPosts: Function;
}

interface PollData {
  question: string;
  options: string[];
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
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== '/logo.png') {
              target.src = '/logo.png';
            }
          }}
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

const CreatePost: React.FC<CreatePostProps> = ({ currentUser, setPosts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorAccept, setEditorAccept] = useState<string>('image/*');
  const [initialMediaFiles, setInitialMediaFiles] = useState<File[] | undefined>(undefined);
  const [pollData, setPollData] = useState<PollData | undefined>(undefined);
  const [initialEventData, setInitialEventData] = useState<any | undefined>(undefined);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPollData(undefined);
    setInitialEventData(undefined);
  };

  const openPollModal = () => {
    setIsPollModalOpen(true);
  };

  const openEventFromToolbar = () => {
    // Open the smaller CreateEventPostModal first.
    setIsEventModalOpen(true);
  };

  const handleEventCreatedFromToolbar = (eventData: any) => {
    // Receive event details from the event modal, then open the main create-post modal
    setInitialEventData(eventData);
    setIsEventModalOpen(false);
    setIsModalOpen(true);
  };

  const closePollModal = () => {
    setIsPollModalOpen(false);
  };

  const handlePollCreated = (newPollData: PollData) => {
    setPollData(newPollData);
    setIsPollModalOpen(false);
    setIsModalOpen(true);
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
        <div className="bg-white px-6 py-4">
          <div className="flex items-center space-x-3">
            <motion.img
              src={currentUser?.photo || '/logo.png'}
              alt="Profile"
              className="w-12 h-12 rounded-full border border-gray-200"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            />
            <motion.button
              onClick={() => openModal()}
              className="flex-1 p-4 bg-gray-50 rounded-lg text-left text-gray-500 hover:bg-gray-100 transition-all duration-200 border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
            >
              <span className="text-gray-600">{`What's on your mind, ${getUserFullName(currentUser)}?`}</span>
            </motion.button>
          </div>
        </div>

        {/* Action Buttons */}
        <motion.div
          className="px-6 py-4 bg-gray-50 border-t border-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={() => openEditor('image/*')}
              className="flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg hover:bg-gray-100 transition-all duration-200"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Camera className="h-5 w-5 text-gray-500 hover:text-gray-700" />
              <span className="font-medium text-gray-600 hover:text-gray-700">Photo</span>
            </motion.button>

            <motion.button
              onClick={() => openEditor('video/*')}
              className="flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg hover:bg-gray-100 transition-all duration-200"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Video className="h-5 w-5 text-gray-500 hover:text-gray-700" />
              <span className="font-medium text-gray-600 hover:text-gray-700">Video</span>
            </motion.button>

            <motion.button
              onClick={openPollModal}
              className="flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg hover:bg-gray-100 transition-all duration-200"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <BarChart className="h-5 w-5 text-gray-500 hover:text-gray-700" />
              <span className="font-medium text-gray-600 hover:text-gray-700">Poll</span>
            </motion.button>

            <motion.button
              onClick={openEventFromToolbar}
              className="flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg hover:bg-gray-100 transition-all duration-200"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Calendar className="h-5 w-5 text-gray-500 hover:text-gray-700" />
              <span className="font-medium text-gray-600 hover:text-gray-700">Event</span>
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

      {isPollModalOpen && (
        <PollModal
          isOpen={isPollModalOpen}
          onClose={closePollModal}
          onCreatePoll={handlePollCreated}
        />
      )}

      {isEventModalOpen && (
        <CreateEventPostModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          onCreateEvent={handleEventCreatedFromToolbar}
        />
      )}

      {isModalOpen && (
        <CreatePostModal
          currentUser={currentUser}
          setPosts={setPosts}
          onClose={closeModal}
          pollData={pollData}
          onPollClick={openPollModal}
          initialMediaFiles={initialMediaFiles}
          eventData={initialEventData}
        />
      )}
    </>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ suggestedUsers, handleFollow }) => {
  return (
    <motion.div
      className="hidden lg:block lg:w-80 lg:min-w-[300px] lg:max-w-[320px] xl:w-96 xl:max-w-[380px] p-2 sm:p-4"
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

const Dashboard: React.FC = () => {
  const { user, isAuthenticated, activeProfile } = useAuth();

  const [posts, setPosts] = useState<IPost[]>([]);
  const [suggestionUsers, setSuggestionUsers] = useState<SuggestionUser[]>([]);
  // const [selectedPost, setSelectedPost] = useState<IPost | null>(null);
  const toast = useToast();
  useEffect(() => {
    const getPosts = async () => {
      try {
        const response = await PostService.getFeed({ limit: 20, profileId: activeProfile?._id });
        if (response.status === 'success') {
          setPosts(response.data.posts || []);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast.open({
          message: {
            heading: 'Failed to Load Posts',
            content: 'Could not load posts. Please refresh the page.',
          },
          duration: 5000,
          position: 'top-center',
          color: 'error',
        });
      }
    };
    getPosts();
  }, [toast]);

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

  const handleFollow = async (followId: string, condition: boolean) => {
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

  return (
    <motion.div
      className="min-h-screen w-full bg-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex max-w-7xl mx-auto px-2 sm:px-4">
        <motion.div
          className="flex-1 w-full min-w-0 px-2 sm:px-4 lg:max-w-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {isAuthenticated() && <CreatePost currentUser={user!} setPosts={setPosts} />}
          {posts.length > 0 &&
            posts.map((item: IPost) => {
              if (item.postType === 'standard') {
                return <StandardPost post={item} key={item._id} />;
              }
              return null;
            })}
        </motion.div>
        <Sidebar suggestedUsers={suggestionUsers} handleFollow={handleFollow} />
      </div>
    </motion.div>
  );
};

export default Dashboard;
