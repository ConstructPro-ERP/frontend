export const config = {
  // Only deploy the current production branch.
  // Prevent feature, fix, main, and other branches
  // from creating unnecessary Preview deployments.
  git: {
    deploymentEnabled: {
      "**": false,
      develop: true,
      main: true,
    },
  },
};
