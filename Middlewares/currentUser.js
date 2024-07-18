let currentUserId = null;

exports.setCurrentUser = (userId) => {
  currentUserId = userId;
};

exports.getCurrentUser = () => {
  return currentUserId;
};
