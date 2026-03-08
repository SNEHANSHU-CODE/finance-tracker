import apiClient from '../utils/axiosConfigs';

export const resetPasswordService = {
    // Send password reset email
    sendPasswordReset: async (emailData) => {
        try {
            const response = await apiClient.post('/reset/sendotp', emailData);
            return response.data.data; // Return the data part of response
        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.message ||
                'Failed to send password reset email'
            );
        }
    },

    // Verify password reset code/token
    verifyPasswordReset: async (verificationData) => {
        try {
            const response = await apiClient.post('/reset/verifyotp', verificationData);
            return response.data.data; // Return the data part of response
        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.message ||
                'Failed to verify reset code'
            );
        }
    },

    // Set new password
    setNewPassword: async (passwordData) => {
        try {
            const response = await apiClient.post('/reset/setnewpassword', passwordData);
            return response.data.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.message ||
                'Failed to reset password'
            );
        }
    },
};