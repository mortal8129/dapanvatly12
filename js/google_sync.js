/**
 * =============================================================================
 * GOOGLE SYNC & ACCOUNT MANAGER (PHƯƠNG ÁN 3: GOOGLE SIGN-IN & GOOGLE SHEETS)
 * =============================================================================
 */

(function(window) {
  'use strict';

  const STORAGE_KEYS = {
    PROFILE: 'vatly12_user_profile',
    CONFIG: 'vatly12_user_config',
    WEBHOOK: 'vatly12_sheet_webhook_url',
    CLIENT_ID: 'vatly12_google_client_id'
  };

  // State
  let currentUser = null;
  let userConfig = {
    theme: 'light',
    preferredUI: 'Fluid Motion Master',
    bookmarks: [],
    wrongQuestions: [],
    soundEnabled: true
  };
  let isSyncing = false;

  // Load from local cache immediately (0 ms delay)
  function initLocalStorage() {
    try {
      const savedProf = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (savedProf) currentUser = JSON.parse(savedProf);

      const savedConf = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (savedConf) userConfig = Object.assign(userConfig, JSON.parse(savedConf));
    } catch (e) {
      console.warn('[Sync] Local storage parse error:', e);
    }
  }

  // Parse JWT token from Google Identity Services
  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  // Handle Google Login Callback
  function handleCredentialResponse(response) {
    const cred = parseJwt(response.credential);
    if (cred) {
      currentUser = {
        sub: cred.sub,
        email: cred.email,
        name: cred.name,
        picture: cred.picture,
        loginAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(currentUser));
      updateAccountUI();
      
      // Pull latest config from Google Sheets
      syncFromCloud().then(() => {
        // Push merged state back
        syncToCloud();
      });

      if (window.showToast) {
        window.showToast(`Chào mừng, ${currentUser.name}!`);
      }
    }
  }

  // Push Config to Google Sheets (Background Sync)
  async function syncToCloud() {
    if (!currentUser || !currentUser.email) return false;
    const webhookUrl = localStorage.getItem(STORAGE_KEYS.WEBHOOK);
    if (!webhookUrl) return false;

    isSyncing = true;
    updateSyncBadge('syncing');

    try {
      const payload = {
        action: 'save_config',
        email: currentUser.email,
        name: currentUser.name,
        picture: currentUser.picture,
        theme: userConfig.theme || 'light',
        preferredUI: userConfig.preferredUI || 'Fluid Motion Master',
        bookmarks: userConfig.bookmarks || [],
        wrongQuestions: userConfig.wrongQuestions || [],
        config: userConfig
      };

      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors', // Google Apps Script handles no-cors gracefully
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      isSyncing = false;
      updateSyncBadge('synced');
      return true;
    } catch (err) {
      isSyncing = false;
      updateSyncBadge('error');
      console.warn('[Sync] Sync to cloud error:', err);
      return false;
    }
  }

  // Pull Config from Google Sheets
  async function syncFromCloud() {
    if (!currentUser || !currentUser.email) return false;
    const webhookUrl = localStorage.getItem(STORAGE_KEYS.WEBHOOK);
    if (!webhookUrl) return false;

    try {
      const fetchUrl = `${webhookUrl}${webhookUrl.includes('?') ? '&' : '?'}action=get_config&email=${encodeURIComponent(currentUser.email)}`;
      const res = await fetch(fetchUrl);
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && json.data) {
          const cloudData = json.data;
          
          // Merge bookmarks
          const mergedBookmarks = Array.from(new Set([...(userConfig.bookmarks || []), ...(cloudData.bookmarks || [])]));
          const mergedWrong = Array.from(new Set([...(userConfig.wrongQuestions || []), ...(cloudData.wrongQuestions || [])]));

          userConfig.bookmarks = mergedBookmarks;
          userConfig.wrongQuestions = mergedWrong;
          if (cloudData.preferredUI) userConfig.preferredUI = cloudData.preferredUI;
          if (cloudData.theme) userConfig.theme = cloudData.theme;

          localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(userConfig));

          // Apply theme if changed
          if (userConfig.theme && document.body) {
            document.body.setAttribute('data-theme', userConfig.theme);
          }

          updateSyncBadge('synced');
          return true;
        }
      }
    } catch (err) {
      console.warn('[Sync] Sync from cloud error:', err);
    }
    return false;
  }

  // Send Exam Results to Google Sheets
  async function recordExamResult(examData) {
    const webhookUrl = localStorage.getItem(STORAGE_KEYS.WEBHOOK);
    if (!webhookUrl) return false;

    try {
      const payload = {
        action: 'save_exam',
        email: currentUser ? currentUser.email : 'Khách vãng lai',
        name: currentUser ? currentUser.name : 'Ẩn danh',
        examCode: examData.examCode || 'Thi Thử GDPT 2018',
        score: examData.score || 0,
        duration: examData.duration || '50:00',
        correctCount: examData.correctCount || 0,
        totalQuestions: examData.totalQuestions || 28,
        details: examData.details || {}
      };

      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return true;
    } catch (err) {
      console.warn('[Sync] Record exam error:', err);
      return false;
    }
  }

  // Update Visual Badges
  function updateSyncBadge(status) {
    const badge = document.getElementById('cloudSyncStatusBadge');
    if (!badge) return;

    if (status === 'syncing') {
      badge.innerHTML = '🔄 <span style="color:var(--primary);">Đang đồng bộ ngầm...</span>';
    } else if (status === 'synced') {
      badge.innerHTML = '☁️ <span style="color:#10b981; font-weight:700;">Đã đồng bộ Google Sheets</span>';
    } else if (status === 'error') {
      badge.innerHTML = '⚠️ <span style="color:#ef4444;">Chưa đồng bộ (Dùng Offline)</span>';
    } else {
      badge.innerHTML = '💾 <span>Lưu trên máy cục bộ</span>';
    }
  }

  function updateAccountUI() {
    const accBtn = document.getElementById('accountBtn');
    const avatarImg = document.getElementById('accUserAvatar');
    const userNameTxt = document.getElementById('accUserName');
    const userEmailTxt = document.getElementById('accUserEmail');
    const loginSection = document.getElementById('accLoginSection');
    const profileSection = document.getElementById('accProfileSection');
    const bookmarkCount = document.getElementById('accBookmarkCount');

    // Update Top Action Button Avatar
    if (accBtn) {
      if (currentUser && currentUser.picture) {
        accBtn.innerHTML = `<img src="${currentUser.picture}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" alt="Avatar">`;
      } else {
        accBtn.innerHTML = '👤';
      }
    }

    // Modal Details
    if (currentUser) {
      if (avatarImg) avatarImg.src = currentUser.picture || '';
      if (userNameTxt) userNameTxt.textContent = currentUser.name || 'Học sinh';
      if (userEmailTxt) userEmailTxt.textContent = currentUser.email || '';
      if (loginSection) loginSection.style.display = 'none';
      if (profileSection) profileSection.style.display = 'block';
    } else {
      if (loginSection) loginSection.style.display = 'block';
      if (profileSection) profileSection.style.display = 'none';
    }

    if (bookmarkCount) {
      bookmarkCount.textContent = (userConfig.bookmarks ? userConfig.bookmarks.length : 0) + ' câu';
    }
  }

  function logout() {
    currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    updateAccountUI();
    updateSyncBadge('local');
    if (window.showToast) window.showToast('Đã đăng xuất tài khoản!');
  }

  // Toggle Bookmark for a question
  function toggleBookmark(questionId) {
    if (!userConfig.bookmarks) userConfig.bookmarks = [];
    const idx = userConfig.bookmarks.indexOf(questionId);
    if (idx >= 0) {
      userConfig.bookmarks.splice(idx, 1);
    } else {
      userConfig.bookmarks.push(questionId);
    }
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(userConfig));
    updateAccountUI();
    syncToCloud(); // Sync in background
    return idx < 0; // returns true if now bookmarked
  }

  function isBookmarked(questionId) {
    return userConfig.bookmarks && userConfig.bookmarks.includes(questionId);
  }

  // Expose API to Window
  window.GoogleSync = {
    init: initLocalStorage,
    handleCredentialResponse: handleCredentialResponse,
    syncToCloud: syncToCloud,
    syncFromCloud: syncFromCloud,
    recordExamResult: recordExamResult,
    logout: logout,
    toggleBookmark: toggleBookmark,
    isBookmarked: isBookmarked,
    getUser: () => currentUser,
    getConfig: () => userConfig,
    updateUI: updateAccountUI
  };

  // Run on start
  initLocalStorage();

})(window);
