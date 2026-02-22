import React, { useState } from 'react';
import { FaEdit, FaSave, FaTimes, FaUser, FaEnvelope, FaTrash, FaKey, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateUserPassword, updateUserProfile, deleteUserAccount } from '../app/authSlice';
import { usePreferences } from '../hooks/usePreferences';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = usePreferences();
  
  // Get user details from auth state of Redux store
  const { user, loading } = useSelector((state) => state.auth);
  
  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || 'User Name',
    email: user?.email || 'useremail@example.com'
  });
  const [editData, setEditData] = useState({ ...profileData });
  const [errors, setErrors] = useState({});

  // Password change state
  const [showCurrPassword, setShowCurrPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [newPassword, setNewPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({
    password: "",
    confirmDeletion: ""
  });
  const [deleteErrors, setDeleteErrors] = useState({});

  // Profile editing handlers
  const handleEdit = () => {
    setIsEditing(true);
    setEditData({ ...profileData });
    setErrors({});
  };

  const validate = () => {
    const newErrors = {};
    const nameRegex = /^[A-Za-z\s]{3,}$/;
    const emailRegex = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/;

    if (!editData.username.trim()) {
      newErrors.username = t('username_required');
    } else if (!nameRegex.test(editData.username)) {
      newErrors.username = t('username_invalid');
    }

    if (!editData.email.trim()) {
      newErrors.email = t('email_required');
    } else if (!emailRegex.test(editData.email)) {
      newErrors.email = t('invalid_email_format');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (validate()) {
      try {
        const userData = {
          username: editData.username,
          email: editData.email
        };
        const result = await dispatch(updateUserProfile(userData)).unwrap();
        setProfileData({
          username: result.user.username,
          email: result.user.email
        });
        setIsEditing(false);
        setErrors({});
      } catch (error) {
        console.error('User details update fail:', error);
        // Handle error display here if needed
      }
    }
  };

  const handleCancel = () => {
    setEditData({ ...profileData });
    setIsEditing(false);
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Password visibility toggles
  const toggleCurrPasswordVisibility = () => {
    setShowCurrPassword(prev => !prev);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(prev => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(prev => !prev);
  };

  // Password change handlers
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setNewPassword(prev => ({ ...prev, [name]: value }));
    // Clear field-specific error when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePassword = () => {
    const newErrors = {};
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!newPassword.currentPassword.trim()) {
      newErrors.currentPassword = t('current_password_required');
    }

    if (!newPassword.newPassword.trim()) {
      newErrors.newPassword = t('new_password_required');
    } else if (!passwordRegex.test(newPassword.newPassword)) {
      newErrors.newPassword = t('password_rule_msg');
    }

    if (!newPassword.confirmPassword.trim()) {
      newErrors.confirmPassword = t('confirm_password_required');
    } else if (newPassword.newPassword !== newPassword.confirmPassword) {
      newErrors.confirmPassword = t('passwords_do_not_match');
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (validatePassword()) {
      try {
        const userData = {
          currentPassword: newPassword.currentPassword,
          newPassword: newPassword.newPassword,
          confirmPassword: newPassword.confirmPassword
        };
        await dispatch(updateUserPassword(userData)).unwrap();
        // Reset form
        setNewPassword({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        setPasswordErrors({});
        // Navigate to home page after successful password change
        navigate('/');
      } catch (error) {
        console.error('Password update failed:', error);
        // Set error message for display
        setPasswordErrors({ submit: t('password_update_failed') });
      }
    }
  };

  // Delete account handlers
  const handleDeleteConfirmChange = (e) => {
    const { name, value } = e.target;
    setDeleteConfirm(prev => ({ ...prev, [name]: value }));
    // Clear errors when user starts typing
    if (deleteErrors[name]) {
      setDeleteErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateDeleteConfirm = () => {
    const newErrors = {};
    
    if (!deleteConfirm.password.trim()) {
      newErrors.password = t('delete_password_required');
    }
    
    if (deleteConfirm.confirmDeletion !== 'DELETE') {
      newErrors.confirmDeletion = t('type_delete_to_confirm');
    }

    setDeleteErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDeleteAccount = async () => {
    if (validateDeleteConfirm()) {
      try {
        await dispatch(deleteUserAccount(deleteConfirm)).unwrap();
        navigate('/');
      } catch (error) {
        console.error('Account deletion failed:', error);
        setDeleteErrors({ submit: t('account_deletion_failed') });
      }
    }
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setDeleteConfirm({ password: "", confirmDeletion: "" });
    setDeleteErrors({});
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirm({ password: "", confirmDeletion: "" });
    setDeleteErrors({});
  };

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-xl-10">
            {/* Header */}
            <div className="d-flex align-items-center mb-4">
              <FaUser className="me-3 text-primary" size={28} />
              <h2 className="mb-0 fw-bold text-dark">{t('profile')}</h2>
            </div>

            {/* Profile Info Card */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <h5 className="card-title mb-0 fw-bold">{t('personal_information')}</h5>
                  {!isEditing ? (
                    <button
                      className="btn btn-outline-primary btn-sm d-flex align-items-center"
                      onClick={handleEdit}
                    >
                      <FaEdit className="me-2" />
                      {t('edit')}
                    </button>
                  ) : (
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-success btn-sm d-flex align-items-center"
                        onClick={handleSave}
                      >
                        <FaSave className="me-2" />
                        {t('save')}
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                        onClick={handleCancel}
                      >
                        <FaTimes className="me-2" />
                        {t('cancel')}
                      </button>
                    </div>
                  )}
                </div>

                <div className="row align-items-center">
                  <div className="col-12 col-md-8 col-lg-9">
                    <div className="row g-3">
                      {/* Name Field */}
                      <div className="col-12">
                        <label className="form-label fw-semibold text-muted mb-1">
                          <FaUser className="me-2" />
                          {t('full_name')}
                        </label>
                        {!isEditing ? (
                          <p className="form-control-plaintext fw-bold text-dark mb-0">
                            {profileData.username}
                          </p>
                        ) : (
                          <>
                            <input
                              type="text"
                              className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                              value={editData.username}
                              onChange={(e) => handleInputChange('username', e.target.value)}
                            />
                            {errors.username && (
                              <div className="invalid-feedback">
                                {errors.username}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Email Field */}
                      <div className="col-12 col-lg-6">
                        <label className="form-label fw-semibold text-muted mb-1">
                          <FaEnvelope className="me-2" />
                          {t('email_address')}
                        </label>
                        {!isEditing ? (
                          <p className="form-control-plaintext text-dark mb-0">
                            {profileData.email}
                          </p>
                        ) : (
                          <>
                            <input
                              type="email"
                              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                              value={editData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                            />
                            {errors.email && (
                              <div className="invalid-feedback">
                                {errors.email}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="card border-0 shadow-sm mt-4">
              <div className="card-header bg-transparent border-0 pt-3">
                <h5 className="mb-0 d-flex align-items-center gap-2 text-primary">
                  <FaKey size={16} />
                  {t('change_password')}
                </h5>
              </div>
              <div className="card-body pt-2">
                {/* Display submit error */}
                {passwordErrors.submit && (
                  <div className="alert alert-danger" role="alert">
                    {passwordErrors.submit}
                  </div>
                )}
                
                <form className="row g-3" onSubmit={handlePasswordUpdate}>
                  <div className="col-md-6 position-relative">
                    <label htmlFor="currentPassword" className="form-label">
                      {t('current_password')}
                    </label>
                    <input
                      type={showCurrPassword ? "text" : "password"}
                      className={`form-control ${passwordErrors.currentPassword ? 'is-invalid' : ''}`}
                      id="currentPassword"
                      name="currentPassword"
                      placeholder={t('enter_current_password')}
                      value={newPassword.currentPassword}
                      onChange={handlePasswordChange}
                    />
                    <span
                      onClick={toggleCurrPasswordVisibility}
                      style={{
                        position: 'absolute',
                        right: '15px',
                        top: '35px',
                        cursor: 'pointer',
                        zIndex: 5
                      }}
                    >
                      {showCurrPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                    {passwordErrors.currentPassword && (
                      <div className="invalid-feedback">
                        {passwordErrors.currentPassword}
                      </div>
                    )}
                  </div>
                  
                  <div className="col-md-6 position-relative">
                    <label htmlFor="newPassword" className="form-label">
                      {t('new_password')}
                    </label>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className={`form-control ${passwordErrors.newPassword ? 'is-invalid' : ''}`}
                      id="newPassword"
                      name="newPassword"
                      placeholder={t('enter_new_password')}
                      value={newPassword.newPassword}
                      onChange={handlePasswordChange}
                    />
                    <span
                      onClick={toggleNewPasswordVisibility}
                      style={{
                        position: 'absolute',
                        right: '15px',
                        top: '35px',
                        cursor: 'pointer',
                        zIndex: 5
                      }}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                    {passwordErrors.newPassword && (
                      <div className="invalid-feedback">
                        {passwordErrors.newPassword}
                      </div>
                    )}
                  </div>
                  
                  <div className="col-md-6 position-relative">
                    <label htmlFor="confirmPassword" className="form-label">
                      {t('confirm_new_password')}
                    </label>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className={`form-control ${passwordErrors.confirmPassword ? 'is-invalid' : ''}`}
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder={t('confirm_new_password_placeholder')}
                      value={newPassword.confirmPassword}
                      onChange={handlePasswordChange}
                    />
                    <span
                      onClick={toggleConfirmPasswordVisibility}
                      style={{
                        position: 'absolute',
                        right: '15px',
                        top: '35px',
                        cursor: 'pointer',
                        zIndex: 5
                      }}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                    {passwordErrors.confirmPassword && (
                      <div className="invalid-feedback">
                        {passwordErrors.confirmPassword}
                      </div>
                    )}
                  </div>
                  
                  <div className="col-12">
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-sm"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          {t('updating')}
                        </>
                      ) : (
                        t('update_password')
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Danger Section- Delete Account */}
            <div className="card border-0 shadow-sm mt-4">
              <div className="card-header bg-transparent border-0 pt-3">
                <h5 className="mb-0 d-flex align-items-center gap-2 text-danger">
                  <FaTrash size={16} />
                  {t('danger_zone')}
                </h5>
              </div>
              <div className="card-body pt-2">
                <div className="alert alert-danger d-flex align-items-start gap-3">
                  <FaTrash className="mt-1" size={16} />
                  <div className="flex-grow-1">
                    <h6 className="alert-heading">{t('delete_account')}</h6>
                    <p className="mb-2">
                      {t('delete_account_description')}
                    </p>
                    <button className="btn btn-danger btn-sm" onClick={openDeleteModal}>
                      {t('delete_my_account')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title text-danger">
                  <FaTrash className="me-2" />
                  {t('delete_account')}
                </h5>
                <button type="button" className="btn-close" onClick={closeDeleteModal}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-danger">
                  <strong>{t('warning')}</strong> {t('irreversible_warning')}
                </div>
                
                {deleteErrors.submit && (
                  <div className="alert alert-danger" role="alert">
                    {deleteErrors.submit}
                  </div>
                )}

                <form>
                  <div className="mb-3">
                    <label htmlFor="deletePassword" className="form-label">
                      {t('enter_password_to_confirm')}
                    </label>
                    <input
                      type="password"
                      className={`form-control ${deleteErrors.password ? 'is-invalid' : ''}`}
                      id="deletePassword"
                      name="password"
                      placeholder={t('enter_password')}
                      value={deleteConfirm.password}
                      onChange={handleDeleteConfirmChange}
                    />
                    {deleteErrors.password && (
                      <div className="invalid-feedback">
                        {deleteErrors.password}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="confirmDeletion" className="form-label">
                      {t('type_delete_to_confirm_label')}
                    </label>
                    <input
                      type="text"
                      className={`form-control ${deleteErrors.confirmDeletion ? 'is-invalid' : ''}`}
                      id="confirmDeletion"
                      name="confirmDeletion"
                      placeholder={t('type_delete_placeholder')}
                      value={deleteConfirm.confirmDeletion}
                      onChange={handleDeleteConfirmChange}
                    />
                    {deleteErrors.confirmDeletion && (
                      <div className="invalid-feedback">
                        {deleteErrors.confirmDeletion}
                      </div>
                    )}
                  </div>
                </form>
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-secondary" onClick={closeDeleteModal}>
                  {t('cancel')}
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={handleDeleteAccount}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {t('deleting')}
                    </>
                  ) : (
                    t('delete_account')
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;