// Authorization utilities for chat system
export class AuthorizationUtils {
  // Check if user has permission to access a chat
  static canAccessChat(userId: string, chatParticipants: string[]): boolean {
    return chatParticipants.includes(userId);
  }

  // Check if user can send messages to a specific chat
  static canSendMessage(userId: string, chatParticipants: string[]): boolean {
    return this.canAccessChat(userId, chatParticipants);
  }

  // Validate profile ownership
  static validateProfileOwnership(userId: string, profileId: string, profileType: string): boolean {
    if (profileType === 'user') {
      return userId === profileId;
    }
    // For company profiles, additional validation would be needed
    // This is a simplified check - implement proper company membership validation
    return true;
  }

  // Check if user can start conversation with target
  static canStartConversation(userId: string, targetUserId: string): boolean {
    // Basic validation - users can't message themselves
    if (userId === targetUserId) {
      return false;
    }

    // Add additional business logic here (e.g., blocking, privacy settings)
    return true;
  }

  // Sanitize user data for safe display
  static sanitizeUserData(user: any): any {
    if (!user) return null;

    return {
      _id: user._id,
      firstName: user.firstName || 'Unknown',
      lastName: user.lastName || '',
      email: user.email || '',
      photo: user.photo || '',
      // Remove any sensitive fields
    };
  }
}
