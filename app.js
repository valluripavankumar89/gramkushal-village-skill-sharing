// Main Application Controller for GramKushal (Village Skill Sharing System)
// Default language: English | Optional: Telugu (తెలుగు) with matched Telugu voice
// Working Profile, Auth (Sign In & Create Account), Learner & Teach Dashboards

let currentLang = 'en';
window.currentLang = 'en';

let currentCategoryFilter = 'all';
let currentVillageFilter = 'all';
let searchQuery = '';
let feeFilter = 'all';
let isPictureMode = false;

// Data state
let teachers = [];
let learners = [];
let currentUser = null;

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  teachers = getStoredData('teachers', INITIAL_TEACHERS);
  learners = getStoredData('learners', INITIAL_LEARNERS);
  currentUser = getCurrentUser();

  renderCategoryGrid();
  renderTeachersList();
  renderLearnersList();
  updateImpactDashboard(teachers, learners);
  setupEventListeners();
  populateVillageDropdowns();
  updateAuthUI();

  console.log("GramKushal platform initialized. Default language: English.");
});

function setupEventListeners() {
  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      setLanguage(e.target.value);
    });
  }

  const voiceToggleBtn = document.getElementById('voice-toggle-btn');
  if (voiceToggleBtn) {
    voiceToggleBtn.addEventListener('click', () => {
      const isEnabled = window.voiceAssistant.toggleVoice();
      const statusText = document.getElementById('voice-status-text');
      if (statusText) {
        if (currentLang === 'te') {
          statusText.textContent = isEnabled ? "వాయిస్ ఆన్" : "వాయిస్ ఆఫ్";
        } else {
          statusText.textContent = isEnabled ? "Voice On" : "Voice Off";
        }
      }
      voiceToggleBtn.classList.toggle('bg-emerald-600', isEnabled);
      voiceToggleBtn.classList.toggle('bg-slate-400', !isEnabled);
    });
  }

  const pictureModeBtn = document.getElementById('picture-mode-toggle');
  if (pictureModeBtn) {
    pictureModeBtn.addEventListener('click', togglePictureMode);
  }

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderTeachersList();
      renderLearnersList();
    });
  }

  const villageFilter = document.getElementById('village-filter');
  if (villageFilter) {
    villageFilter.addEventListener('change', (e) => {
      currentVillageFilter = e.target.value;
      renderTeachersList();
      renderLearnersList();
    });
  }

  document.querySelectorAll('[data-fee-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-fee-filter]').forEach(b => b.classList.remove('active-fee'));
      btn.classList.add('active-fee');
      feeFilter = btn.getAttribute('data-fee-filter');
      renderTeachersList();
    });
  });

  document.querySelectorAll('[data-tab-target]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = link.getAttribute('data-tab-target');
      switchTab(targetTab);
    });
  });

  setupModals();
  setupAuthForms();

  const exportBtn = document.getElementById('export-report-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportImpactReportCSV(teachers, learners);
    });
  }
}

// ==========================================
// AUTH & PROFILE MANAGEMENT
// ==========================================

function updateAuthUI() {
  const profileBtn = document.getElementById('header-profile-btn');
  const authGroup = document.getElementById('header-auth-group');
  const headerUserName = document.getElementById('header-user-name');
  const isTe = (currentLang === 'te');

  if (currentUser) {
    if (profileBtn) profileBtn.classList.remove('hidden');
    if (authGroup) authGroup.classList.add('hidden');
    if (headerUserName) {
      headerUserName.textContent = isTe ? (currentUser.nameTe || currentUser.name) : currentUser.name;
    }
  } else {
    if (profileBtn) profileBtn.classList.add('hidden');
    if (authGroup) {
      authGroup.classList.remove('hidden');
      authGroup.classList.add('flex');
    }
  }
}

function openProfileModal() {
  if (!currentUser) {
    openSignInModal();
    return;
  }

  window.voiceAssistant.playChirp('click');
  renderProfileContent();
  openModal('user-profile-modal');

  const isTe = (currentLang === 'te');
  const userName = isTe ? (currentUser.nameTe || currentUser.name) : currentUser.name;
  const village = isTe ? (currentUser.villageTe || currentUser.village) : currentUser.village;
  const msg = isTe 
    ? `${userName} ప్రొఫైల్. గ్రామం: ${village}. మీ అభ్యాస మరియు బోధనా వివరాలు ఇక్కడ ఉన్నాయి.`
    : `Profile of ${userName} from ${village}. Here are your learning and teaching sections.`;
  window.voiceAssistant.speak(msg, currentLang);
}

function renderProfileContent() {
  if (!currentUser) return;
  const isTe = (currentLang === 'te');

  // Basic Info
  const profNameElem = document.getElementById('profile-user-name');
  const profPhoneElem = document.getElementById('profile-user-phone');
  const profVillageElem = document.getElementById('profile-user-village');
  const profJoinedElem = document.getElementById('profile-user-joined');

  if (profNameElem) profNameElem.textContent = isTe ? (currentUser.nameTe || currentUser.name) : currentUser.name;
  if (profPhoneElem) profPhoneElem.textContent = currentUser.phone || '9876543210';
  if (profVillageElem) profVillageElem.textContent = isTe ? (currentUser.villageTe || currentUser.village) : currentUser.village;
  if (profJoinedElem) profJoinedElem.textContent = isTe ? (currentUser.joinedDateTe || currentUser.joinedDate || 'జనవరి 2026') : (currentUser.joinedDate || 'January 2026');

  // --- SECTION A: LEARNER SECTION ---
  const requests = currentUser.learnerRequests || [];
  const totalRequests = requests.length;
  const acceptedCount = requests.filter(r => r.status === 'Accepted').length;
  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const failedCount = requests.filter(r => r.status === 'Failed' || r.status === 'Declined').length;

  const countTotalElem = document.getElementById('profile-stat-requests-total');
  const countAcceptedElem = document.getElementById('profile-stat-requests-accepted');
  const countPendingElem = document.getElementById('profile-stat-requests-pending');
  const countFailedElem = document.getElementById('profile-stat-requests-failed');

  if (countTotalElem) countTotalElem.textContent = totalRequests;
  if (countAcceptedElem) countAcceptedElem.textContent = acceptedCount;
  if (countPendingElem) countPendingElem.textContent = pendingCount;
  if (countFailedElem) countFailedElem.textContent = failedCount;

  const requestsListContainer = document.getElementById('profile-learner-requests-list');
  if (requestsListContainer) {
    if (requests.length === 0) {
      requestsListContainer.innerHTML = `
        <div class="py-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-4">
          <p class="text-xs text-slate-500 font-semibold mb-2">${isTe ? "మీరు ఇంకా ఏ అభ్యాస అభ్యర్థనలు చేయలేదు." : "You have not put any learning requests yet."}</p>
          <button onclick="closeModal('user-profile-modal'); openModal('add-learner-modal');" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm">
            ${isTe ? "➕ కొత్త అభ్యర్థన చేయండి" : "➕ Put Learning Request"}
          </button>
        </div>
      `;
    } else {
      requestsListContainer.innerHTML = requests.map(r => {
        const skill = isTe ? (r.skillTitleTe || r.skillTitle) : r.skillTitle;
        const mentor = isTe ? (r.mentorNameTe || r.mentorName) : r.mentorName;
        let statusBadge = '';
        if (r.status === 'Accepted') {
          statusBadge = `<span class="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1">✓ ${isTe ? 'అంగీకరించబడింది' : 'Accepted'}</span>`;
        } else if (r.status === 'Pending') {
          statusBadge = `<span class="bg-amber-100 text-amber-800 border border-amber-300 text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1">⏳ ${isTe ? 'పరిశీలనలో ఉంది' : 'Pending'}</span>`;
        } else {
          statusBadge = `<span class="bg-rose-100 text-rose-800 border border-rose-300 text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1">✕ ${isTe ? 'విఫలమైంది / రద్దు' : 'Failed / Declined'}</span>`;
        }

        return `
          <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-blue-50/40 transition-all">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-base font-black text-slate-900">${skill}</span>
                ${statusBadge}
              </div>
              <div class="text-xs text-slate-600 flex flex-wrap items-center gap-3 font-medium">
                <span>🧑‍🏫 <b>${isTe ? 'గురువు:' : 'Mentor:'}</b> ${mentor}</span>
                <span>💰 <b>${isTe ? 'బడ్జెట్:' : 'Budget:'}</b> ${r.budget}</span>
                <span>📅 <b>${isTe ? 'తేది:' : 'Date:'}</b> ${r.date}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              ${r.status === 'Pending' ? `
                <button onclick="updateRequestStatus('${r.id}', 'Accepted')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm">
                  ${isTe ? 'అంగీకరించు' : 'Accept'}
                </button>
                <button onclick="updateRequestStatus('${r.id}', 'Failed')" class="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm">
                  ${isTe ? 'రద్దు' : 'Decline'}
                </button>
              ` : `
                <button onclick="deleteRequest('${r.id}')" class="text-slate-400 hover:text-rose-600 text-xs font-bold px-2 py-1">
                  ${isTe ? 'తొలగించు' : 'Remove'}
                </button>
              `}
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // --- SECTION B: TEACH SECTION ---
  const teachSkills = currentUser.teachSkills || [];
  let totalLearnersJoined = 0;
  let totalMoneyEarned = 0;

  teachSkills.forEach(s => {
    totalLearnersJoined += (s.learnersJoined || 0);
    totalMoneyEarned += (s.moneyEarned || ((s.learnersJoined || 0) * (s.monthlyFee || 100)));
  });

  const teachSkillsCountElem = document.getElementById('profile-stat-teach-skills');
  const teachLearnersCountElem = document.getElementById('profile-stat-teach-learners');
  const teachEarnedElem = document.getElementById('profile-stat-teach-earned');

  if (teachSkillsCountElem) teachSkillsCountElem.textContent = teachSkills.length;
  if (teachLearnersCountElem) teachLearnersCountElem.textContent = totalLearnersJoined;
  if (teachEarnedElem) teachEarnedElem.textContent = `₹${totalMoneyEarned.toLocaleString('en-IN')}`;

  const teachListContainer = document.getElementById('profile-teach-skills-list');
  if (teachListContainer) {
    if (teachSkills.length === 0) {
      teachListContainer.innerHTML = `
        <div class="py-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-4">
          <p class="text-xs text-slate-500 font-semibold mb-2">${isTe ? "మీరు ఇంకా ఏ బోధనా నైపుణ్యాన్ని నమోదు చేయలేదు." : "You have not registered any teaching skill yet."}</p>
          <button onclick="closeModal('user-profile-modal'); openModal('add-teacher-modal');" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm">
            ${isTe ? "➕ నేను నేర్పిస్తాను (నైపుణ్యం జోడించు)" : "➕ I Want to Teach (Add Skill)"}
          </button>
        </div>
      `;
    } else {
      teachListContainer.innerHTML = teachSkills.map(ts => {
        const title = isTe ? (ts.skillTitleTe || ts.skillTitle) : ts.skillTitle;
        const fee = ts.monthlyFee === 0 
          ? (isTe ? 'ఉచితం' : 'Free') 
          : `₹${ts.monthlyFee} ${isTe ? '/ నెలకు' : '/ mo'}`;
        const joined = ts.joinedLearners || [];

        return `
          <div class="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-2">
              <div>
                <span class="text-xs font-black text-emerald-800 uppercase tracking-wide">${isTe ? 'నైపుణ్యం:' : 'Teaching Skill:'}</span>
                <h4 class="text-base font-black text-slate-900 leading-snug">${title}</h4>
              </div>
              <div class="text-right">
                <span class="text-xs text-slate-500 font-bold block">${isTe ? 'ఫీజు / ఆదాయం' : 'Fee / Earning'}</span>
                <span class="text-sm font-black text-emerald-700">${fee} • ₹${(ts.moneyEarned || (ts.learnersJoined * ts.monthlyFee)).toLocaleString('en-IN')} ${isTe ? 'సంపాదన' : 'earned'}</span>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-slate-700">${isTe ? 'చేరిన విద్యార్థులు / శిష్యులు:' : 'Joined Learners:'} (${ts.learnersJoined} ${isTe ? 'మంది' : 'total'})</span>
                <button onclick="addSimulatedLearner('${ts.skillId}')" class="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-white border border-emerald-300 px-2 py-0.5 rounded-lg shadow-2xs">
                  + ${isTe ? 'కొత్త శిష్యుడిని చేర్చు' : 'Add Learner'}
                </button>
              </div>

              <div class="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                ${joined.map(jl => `
                  <div class="bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2">
                      <span class="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs">👤</span>
                      <div>
                        <span class="font-extrabold text-slate-900">${jl.name}</span>
                        <span class="text-slate-500 text-[11px]">📍 ${jl.village} • 📞 ${jl.phone}</span>
                      </div>
                    </div>
                    <span class="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      ${jl.feePaid || '₹100'} ${isTe ? 'చెల్లించారు' : 'Paid'}
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

function handleLogout() {
  window.voiceAssistant.playChirp('click');
  currentUser = null;
  setCurrentUser(null);
  updateAuthUI();
  closeModal('user-profile-modal');

  const isTe = (currentLang === 'te');
  const msg = isTe ? "మీరు విజయవంతంగా లాగ్ అవుట్ అయ్యారు." : "You have been logged out.";
  window.voiceAssistant.speak(msg, currentLang);
}

function openSignInModal() {
  window.voiceAssistant.playChirp('click');
  const errorBox = document.getElementById('signin-error-box');
  if (errorBox) errorBox.classList.add('hidden');
  openModal('signin-modal');
}

function openRegisterModal() {
  window.voiceAssistant.playChirp('click');
  openModal('register-modal');
}

function setupAuthForms() {
  // Sign In Form
  const signInForm = document.getElementById('signin-form');
  if (signInForm) {
    signInForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('signin-name').value.trim();
      const phoneInput = document.getElementById('signin-phone').value.trim();
      const errorBox = document.getElementById('signin-error-box');

      const users = getStoredUsers();
      // Match name (case-insensitive) and phone
      const matched = users.find(u => {
        const matchName = (u.name || '').toLowerCase() === nameInput.toLowerCase() ||
                          (u.nameTe || '').toLowerCase() === nameInput.toLowerCase() ||
                          (u.name || '').toLowerCase().includes(nameInput.toLowerCase());
        const matchPhone = (u.phone || '').trim() === phoneInput;
        return matchName && matchPhone;
      });

      if (matched) {
        window.voiceAssistant.playChirp('success');
        currentUser = matched;
        setCurrentUser(currentUser);
        updateAuthUI();
        closeModal('signin-modal');
        signInForm.reset();

        const isTe = (currentLang === 'te');
        const msg = isTe ? `స్వాగతం ${matched.nameTe || matched.name}! మీరు విజయవంతంగా లాగిన్ అయ్యారు.` : `Welcome back ${matched.name}! Signed in successfully.`;
        window.voiceAssistant.speak(msg, currentLang);
        openProfileModal();
      } else {
        if (errorBox) {
          errorBox.classList.remove('hidden');
        }
        window.voiceAssistant.speak(currentLang === 'te' ? "పేరు లేదా మొబైల్ నంబర్ సరిపోలలేదు." : "Invalid name or phone number.", currentLang);
      }
    });
  }

  // Register Form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      window.voiceAssistant.playChirp('success');

      const name = document.getElementById('register-name').value.trim();
      const phone = document.getElementById('register-phone').value.trim();
      const village = document.getElementById('register-village').value.trim();

      const users = getStoredUsers();
      const newUser = {
        id: "u_" + Date.now(),
        name,
        nameTe: name,
        phone,
        village,
        villageTe: village,
        role: "Village Member",
        joinedDate: "Today",
        joinedDateTe: "ఈ రోజే",
        teachSkills: [],
        learnerRequests: []
      };

      users.push(newUser);
      saveStoredUsers(users);

      currentUser = newUser;
      setCurrentUser(currentUser);
      updateAuthUI();
      closeModal('register-modal');
      registerForm.reset();

      const isTe = (currentLang === 'te');
      const msg = isTe ? `అభినందనలు ${name}! మీ ఖాతా విజయవంతంగా తెరవబడింది.` : `Congratulations ${name}! Your account has been created successfully.`;
      window.voiceAssistant.speak(msg, currentLang);
      openProfileModal();
    });
  }
}

// Quick demo login helper
function quickLoginAs(userId) {
  const users = getStoredUsers();
  const user = users.find(u => u.id === userId) || users[0];
  if (user) {
    window.voiceAssistant.playChirp('success');
    currentUser = user;
    setCurrentUser(currentUser);
    updateAuthUI();
    closeModal('signin-modal');
    closeModal('register-modal');

    const isTe = (currentLang === 'te');
    const msg = isTe ? `${user.nameTe || user.name} లాగిన్ అయ్యారు.` : `Logged in as ${user.name}.`;
    window.voiceAssistant.speak(msg, currentLang);
    openProfileModal();
  }
}

// Interactive Learner Request status updates inside Profile
function updateRequestStatus(reqId, newStatus) {
  if (!currentUser || !currentUser.learnerRequests) return;
  const req = currentUser.learnerRequests.find(r => r.id === reqId);
  if (req) {
    req.status = newStatus;
    setCurrentUser(currentUser);
    const users = getStoredUsers();
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) {
      users[idx] = currentUser;
      saveStoredUsers(users);
    }
    window.voiceAssistant.playChirp('success');
    renderProfileContent();
  }
}

function deleteRequest(reqId) {
  if (!currentUser || !currentUser.learnerRequests) return;
  currentUser.learnerRequests = currentUser.learnerRequests.filter(r => r.id !== reqId);
  setCurrentUser(currentUser);
  const users = getStoredUsers();
  const idx = users.findIndex(u => u.id === currentUser.id);
  if (idx !== -1) {
    users[idx] = currentUser;
    saveStoredUsers(users);
  }
  renderProfileContent();
}

function addSimulatedLearner(skillId) {
  if (!currentUser || !currentUser.teachSkills) return;
  const skill = currentUser.teachSkills.find(s => s.skillId === skillId);
  if (skill) {
    skill.learnersJoined = (skill.learnersJoined || 0) + 1;
    skill.moneyEarned = (skill.moneyEarned || 0) + (skill.monthlyFee || 100);
    if (!skill.joinedLearners) skill.joinedLearners = [];
    skill.joinedLearners.unshift({
      name: "New Village Learner",
      village: currentUser.village || "Rampur",
      phone: "912345" + Math.floor(1000 + Math.random() * 9000),
      status: "Active",
      feePaid: `₹${skill.monthlyFee || 100}`
    });

    setCurrentUser(currentUser);
    const users = getStoredUsers();
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) {
      users[idx] = currentUser;
      saveStoredUsers(users);
    }
    window.voiceAssistant.playChirp('success');
    renderProfileContent();
  }
}

// ==========================================
// CORE APP FEATURES
// ==========================================

function setLanguage(lang) {
  currentLang = lang;
  window.currentLang = lang;
  window.voiceAssistant.currentLang = lang;
  window.voiceAssistant.playChirp('click');

  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Update elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const key = elem.getAttribute('data-i18n');
    if (dict[key]) {
      elem.textContent = dict[key];
    }
  });

  // Update search placeholder
  const searchInput = document.getElementById('search-input');
  if (searchInput && dict.searchPlaceholder) {
    searchInput.placeholder = dict.searchPlaceholder;
  }

  // Update voice status text
  const statusText = document.getElementById('voice-status-text');
  if (statusText) {
    const isEnabled = window.voiceAssistant.voiceEnabled;
    if (lang === 'te') {
      statusText.textContent = isEnabled ? "వాయిస్ సహాయం" : "వాయిస్ ఆఫ్";
    } else {
      statusText.textContent = isEnabled ? "Voice Help" : "Voice Off";
    }
  }

  updateAuthUI();
  populateVillageDropdowns();
  renderCategoryGrid();
  renderTeachersList();
  renderLearnersList();
  updateImpactDashboard(teachers, learners);

  if (document.getElementById('user-profile-modal') && !document.getElementById('user-profile-modal').classList.contains('hidden')) {
    renderProfileContent();
  }

  const announcement = (lang === 'te') 
    ? "తెలుగు భాష ఎంచుకోబడింది. గ్రామకుశల్‌కు స్వాగతం." 
    : "English language selected. Welcome to GramKushal.";
  window.voiceAssistant.speak(announcement, lang);
}

function switchTab(tabId) {
  window.voiceAssistant.playChirp('click');
  document.querySelectorAll('.tab-content').forEach(section => {
    section.classList.add('hidden');
  });

  const activeSection = document.getElementById(tabId + '-section');
  if (activeSection) {
    activeSection.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('[data-tab-target]').forEach(btn => {
    const isTarget = btn.getAttribute('data-tab-target') === tabId;
    btn.classList.toggle('nav-active', isTarget);
    btn.classList.toggle('nav-inactive', !isTarget);
  });

  if (currentLang === 'te') {
    const tabNamesTe = {
      'home': 'హోమ్ పేజీ. గ్రామ నైపుణ్యాల మార్పిడి.',
      'skills': 'గ్రామ గురువుల జాబితా.',
      'learners': 'నేర్చుకునే విద్యార్థుల బోర్డు.',
      'impact': 'గ్రామీణాభివృద్ధి నివేదిక మరియు గణాంకాలు.'
    };
    if (tabNamesTe[tabId]) window.voiceAssistant.speak(tabNamesTe[tabId], 'te');
  } else {
    const tabNamesEn = {
      'home': 'Home page. Skill sharing within the village.',
      'skills': 'Village Mentors and Teachers directory.',
      'learners': 'Learners Board. See what skills villagers want to learn.',
      'impact': 'Rural Development Impact & Project Report.'
    };
    if (tabNamesEn[tabId]) window.voiceAssistant.speak(tabNamesEn[tabId], 'en');
  }
}

function togglePictureMode() {
  isPictureMode = !isPictureMode;
  document.body.classList.toggle('picture-mode-active', isPictureMode);
  
  const btn = document.getElementById('picture-mode-toggle');
  if (btn) {
    btn.classList.toggle('bg-amber-500', isPictureMode);
    btn.classList.toggle('text-white', isPictureMode);
    btn.classList.toggle('bg-amber-100', !isPictureMode);
  }

  if (currentLang === 'te') {
    const msg = isPictureMode 
      ? "బొమ్మల మోడ్ ప్రారంభించబడింది. పెద్ద బొమ్మలు మరియు స్పష్టమైన రంగులు చూపించబడుతున్నాయి."
      : "సాధారణ మోడ్ ప్రారంభించబడింది.";
    window.voiceAssistant.speak(msg, 'te');
  } else {
    const msg = isPictureMode 
      ? "Picture mode is activated with larger symbols and high contrast colors."
      : "Standard mode activated.";
    window.voiceAssistant.speak(msg, 'en');
  }

  renderCategoryGrid();
  renderTeachersList();
}

function populateVillageDropdowns() {
  const isTe = (currentLang === 'te');
  const villages = [...new Set([
    ...teachers.map(t => isTe ? (t.villageTe || t.village) : t.village),
    ...learners.map(l => isTe ? (l.villageTe || l.village) : l.village),
    isTe ? "రాంపూర్" : "Rampur",
    isTe ? "శివపూర్" : "Shivpur",
    isTe ? "ఆనంద్‌పూర్" : "Anandpur",
    isTe ? "కృపాల్‌పూర్" : "Kripalpur",
    isTe ? "సుందర్‌పూర్" : "Sundarpur"
  ])];

  const select = document.getElementById('village-filter');
  if (select) {
    const allText = isTe ? "🏡 అన్ని గ్రామాలు (All Villages)" : "🏡 All Villages";
    select.innerHTML = `<option value="all">${allText}</option>` + 
      villages.map(v => `<option value="${v}">${v}</option>`).join('');
  }

  const teacherVillageSelect = document.getElementById('teacher-village-select');
  if (teacherVillageSelect) {
    teacherVillageSelect.innerHTML = villages.map(v => `<option value="${v}">${v}</option>`).join('');
  }

  const regVillageSelect = document.getElementById('register-village');
  if (regVillageSelect) {
    regVillageSelect.innerHTML = villages.map(v => `<option value="${v}">${v}</option>`).join('');
  }
}

function renderCategoryGrid() {
  const container = document.getElementById('category-grid');
  if (!container) return;

  const isTe = (currentLang === 'te');
  const allTitle = isTe ? "అన్ని నైపుణ్యాలు" : "All Skills";
  const mentorsLabel = isTe ? "గురువులు" : "Mentors";
  const listenLabel = isTe ? "🔊 వినండి" : "🔊 Listen";

  let html = `
    <div 
      onclick="filterCategory('all', '${allTitle}')"
      class="category-card cursor-pointer p-3 md:p-4 rounded-2xl border-2 transition-all duration-200 text-center flex flex-col items-center justify-center shadow-sm hover:shadow-md ${currentCategoryFilter === 'all' ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500 ring-offset-2' : 'border-slate-200 bg-white hover:border-emerald-300'}"
    >
      <div class="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-3xl mb-2 shadow-inner">
        🌟
      </div>
      <span class="font-black text-slate-800 text-sm md:text-base">${allTitle}</span>
      <span class="text-[11px] text-slate-500 font-semibold">${teachers.length} ${mentorsLabel}</span>
      <button onclick="event.stopPropagation(); window.voiceAssistant.speak('${isTe ? "అన్ని నైపుణ్యాలు మరియు గురువులను చూడండి" : "View all skills and teachers"}', '${currentLang}')" class="mt-2 text-xs text-emerald-800 bg-emerald-200/60 hover:bg-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1 font-bold">
        ${listenLabel}
      </button>
    </div>
  `;

  CATEGORIES_DEF.forEach(cat => {
    const isSelected = currentCategoryFilter === cat.id;
    const count = teachers.filter(t => t.skillId === cat.id).length;
    const catName = isTe ? cat.nameTe : cat.name;
    const catDesc = isTe ? cat.descTe : cat.desc;
    const catSymbolDesc = isTe ? cat.symbolDescTe : cat.symbolDesc;

    html += `
      <div 
        onclick="filterCategory('${cat.id}', '${catName}')"
        class="category-card cursor-pointer p-3 md:p-4 rounded-2xl border-2 transition-all duration-200 text-center flex flex-col items-center justify-center shadow-sm hover:shadow-md relative ${isSelected ? 'ring-2 ring-offset-2' : 'hover:scale-[1.02]'}"
        style="
          background-color: ${isSelected ? cat.bgLight : '#ffffff'};
          border-color: ${isSelected ? cat.color : cat.borderColor};
          ${isSelected ? `ring-color: ${cat.color};` : ''}
        "
      >
        <div class="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-3xl md:text-4xl mb-2 shadow-inner transition-transform group-hover:scale-110" style="background-color: ${cat.bgLight}">
          ${cat.icon}
        </div>

        <span class="font-black text-slate-900 text-sm md:text-base leading-snug">${catName}</span>
        <span class="text-[11px] text-slate-500 font-medium">${catSymbolDesc}</span>
        
        <span class="mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full" style="background-color: ${cat.bgLight}; color: ${cat.color};">
          ${count} ${mentorsLabel}
        </span>

        <button 
          onclick="event.stopPropagation(); window.voiceAssistant.speak('${catName}. ${catDesc}. ${isTe ? `${count} గురువులు అందుబాటులో ఉన్నారు.` : `${count} mentors available.`}', '${currentLang}')" 
          class="mt-2 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors hover:brightness-95"
          style="background-color: ${cat.bgLight}; color: ${cat.color};"
        >
          ${listenLabel}
        </button>
      </div>
    `;
  });

  container.innerHTML = html;
}

function filterCategory(catId, catName) {
  currentCategoryFilter = catId;
  window.voiceAssistant.playChirp('click');
  renderCategoryGrid();
  renderTeachersList();
  renderLearnersList();

  const isTe = (currentLang === 'te');
  const msg = catId === 'all' 
    ? (isTe ? "అన్ని నైపుణ్యాలు చూపించబడుతున్నాయి." : "Showing all skills.") 
    : (isTe ? `${catName} నైపుణ్యం కలిగిన గురువులు చూపించబడుతున్నారు.` : `Showing teachers for ${catName}.`);
  window.voiceAssistant.speak(msg, currentLang);
}

function renderTeachersList() {
  const container = document.getElementById('teachers-grid');
  const countBadge = document.getElementById('teachers-count-badge');
  if (!container) return;

  const isTe = (currentLang === 'te');

  let filtered = teachers.filter(t => {
    if (currentCategoryFilter !== 'all' && t.skillId !== currentCategoryFilter) return false;
    if (currentVillageFilter !== 'all' && t.village !== currentVillageFilter && t.villageTe !== currentVillageFilter) return false;
    if (feeFilter === 'free' && !t.isFreeOrBarter) return false;
    if (feeFilter === 'low' && t.feeNumber > 100) return false;

    if (searchQuery) {
      const matchName = (t.name || '').toLowerCase().includes(searchQuery) || (t.nameTe || '').toLowerCase().includes(searchQuery);
      const matchSkill = (t.skillTitle || '').toLowerCase().includes(searchQuery) || (t.skillTitleTe || '').toLowerCase().includes(searchQuery);
      const matchVillage = (t.village || '').toLowerCase().includes(searchQuery) || (t.villageTe || '').toLowerCase().includes(searchQuery);
      if (!matchName && !matchSkill && !matchVillage) return false;
    }
    return true;
  });

  if (countBadge) {
    countBadge.textContent = isTe 
      ? `${filtered.length} గురువులు అందుబాటులో ఉన్నారు` 
      : `${filtered.length} Mentors Available`;
  }

  if (filtered.length === 0) {
    const emptyTitle = isTe ? "ఈ విభాగంలో లేదా గ్రామంలో ప్రస్తుతం గురువులు లేరు" : "No mentors found in this category or village";
    const emptyDesc = isTe ? "మీకు ఈ నైపుణ్యం తెలుసా? మీ పేరును నమోదు చేసుకొని గ్రామంలో అదనపు ఆదాయం పొందండి!" : "Can you teach this skill? Register your name and earn supplemental income in your village!";
    const emptyBtn = isTe ? "➕ నా నైపుణ్యాన్ని జోడిస్తాను (నేను నేర్పుతాను)" : "➕ Add Your Skill (I Want to Teach)";

    const emptyHtml = `
      <div class="col-span-full py-16 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8">
        <div class="text-6xl mb-4">🔍</div>
        <h3 class="text-xl font-bold text-slate-800 mb-2">${emptyTitle}</h3>
        <p class="text-slate-600 mb-6 max-w-md mx-auto text-sm">${emptyDesc}</p>
        <button onclick="openModal('add-teacher-modal')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 mx-auto">
          <span>${emptyBtn}</span>
        </button>
      </div>
    `;
    container.innerHTML = emptyHtml;
    const tabContainer = document.getElementById('teachers-grid-tab');
    if (tabContainer) tabContainer.innerHTML = emptyHtml;
    return;
  }

  let html = '';
  filtered.forEach(t => {
    const cat = CATEGORIES_DEF.find(c => c.id === t.skillId) || {
      icon: "⭐",
      color: "#16a34a",
      bgLight: "#dcfce7",
      name: "Skill",
      nameTe: "నైపుణ్యం"
    };

    const isFree = t.isFreeOrBarter || t.feeNumber === 0;
    const name = isTe ? (t.nameTe || t.name) : t.name;
    const village = isTe ? (t.villageTe || t.village) : t.village;
    const catName = isTe ? cat.nameTe : cat.name;
    const skillTitle = isTe ? (t.skillTitleTe || t.skillTitle) : t.skillTitle;
    const location = isTe ? (t.locationDetailsTe || t.locationDetails || t.ward) : (t.locationDetails || t.ward);
    const timing = isTe ? (t.timingTe || t.timing) : t.timing;
    const bio = isTe ? (t.bioTe || t.bio) : t.bio;
    const feeText = isFree 
      ? (isTe ? "ఉచితం (నైపుణ్య మార్పిడి)" : "Free (Skill Exchange)") 
      : (isTe ? `₹${t.feeNumber} / నెలకు` : `₹${t.feeNumber} / month`);

    const callLabel = isTe ? "ఫోన్ చేయండి" : "Call Mentor";
    const waLabel = isTe ? "వాట్సాప్" : "WhatsApp";
    const verifiedLabel = isTe ? "✓ ధృవీకరించబడింది" : "✓ Verified";
    const teachingSkillLabel = isTe ? "నేర్పించే నైపుణ్యం:" : "Teaching Skill:";
    const locationLabel = isTe ? "🏛️ ప్రదేశం:" : "🏛️ Location:";
    const timingLabel = isTe ? "⏰ సమయం:" : "⏰ Timing:";
    const feeLabel = isTe ? "నెలవారీ రుసుము" : "Monthly Fee";
    const trackLabel = isTe ? "అనుభవం" : "Track Record";
    const learnersWord = isTe ? "శిష్యులు" : "learners";

    const spokenText = isTe 
      ? `${name}, ${village}లో ${skillTitle} నేర్పుతున్నారు. ప్రదేశం: ${location}. రుసుము: ${isFree ? 'ఉచితం' : `${t.feeNumber} రూపాయలు`}. ఫోన్ చేయడానికి ఆకుపచ్చ బటన్ నొక్కండి.`
      : `${name} from ${village} teaches ${skillTitle}. Location is ${location}. Fee is ${isFree ? 'completely free' : `${t.feeNumber} rupees per month`}. Press green button to call.`;

    html += `
      <div class="teacher-card bg-white rounded-3xl border-2 border-slate-200/80 p-5 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between relative overflow-hidden group">
        <div class="absolute top-0 left-0 right-0 h-2" style="background-color: ${cat.color}"></div>

        <div>
          <div class="flex items-start justify-between gap-3 mb-3 pt-1">
            <div class="flex items-center gap-3">
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-slate-200 shrink-0" style="background-color: ${t.avatarBg || cat.bgLight}">
                ${t.avatar || cat.icon}
              </div>
              <div>
                <h4 class="font-black text-slate-900 text-base md:text-lg leading-tight">${name}</h4>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                    📍 ${village}
                  </span>
                  ${t.verified ? `<span class="text-xs text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-md font-bold" title="${verifiedLabel}">${verifiedLabel}</span>` : ''}
                </div>
              </div>
            </div>

            <div class="p-2 rounded-xl text-xl shadow-inner shrink-0" style="background-color: ${cat.bgLight}" title="${catName}">
              ${cat.icon}
            </div>
          </div>

          <div class="bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-3">
            <div class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5 flex items-center justify-between">
              <span>${teachingSkillLabel}</span>
              <span class="text-[11px] font-bold" style="color: ${cat.color}">${catName}</span>
            </div>
            <p class="font-extrabold text-slate-900 text-sm leading-snug">${skillTitle}</p>
          </div>

          <div class="space-y-1.5 text-xs text-slate-700 mb-3">
            <div class="flex items-start gap-1.5">
              <span class="text-amber-700 font-bold shrink-0">${locationLabel}</span>
              <span class="font-medium text-slate-800">${location}</span>
            </div>
            <div class="flex items-start gap-1.5">
              <span class="text-indigo-700 font-bold shrink-0">${timingLabel}</span>
              <span class="font-medium text-slate-800">${timing}</span>
            </div>
          </div>

          <p class="text-xs text-slate-600 line-clamp-2 mb-3 bg-amber-50/50 p-2 rounded-xl border border-amber-100">
            "${bio}"
          </p>
        </div>

        <div class="pt-3 border-t border-slate-100">
          <div class="flex items-center justify-between mb-3">
            <div>
              <span class="text-[10px] font-bold text-slate-500 uppercase block">${feeLabel}</span>
              <span class="text-sm md:text-base font-black ${isFree ? 'text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md' : 'text-slate-900'}">
                ${feeText}
              </span>
            </div>

            <div class="text-right">
              <span class="text-[10px] font-bold text-slate-500 uppercase block">${trackLabel}</span>
              <span class="text-xs font-bold text-slate-800">
                ⭐ ${t.rating} (${t.studentsTaught} ${learnersWord})
              </span>
            </div>
          </div>

          <div class="grid grid-cols-12 gap-2">
            <a 
              href="tel:${t.phone}" 
              onclick="window.voiceAssistant.playChirp('click')"
              class="col-span-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs md:text-sm py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all text-center"
            >
              <span class="text-base">📞</span>
              <span>${callLabel}</span>
            </a>

            <a 
              href="https://wa.me/91${t.phone}?text=${encodeURIComponent(isTe ? `నమస్తే ${name}! గ్రామకుశల్ లో మీ నైపుణ్యం "${skillTitle}" చూశాను. నేను మీ వద్ద నేర్చుకోవాలనుకుంటున్నాను.` : `Hello ${name}! I saw your skill "${skillTitle}" on GramKushal. I am interested in learning from you.`)}" 
              target="_blank"
              onclick="window.voiceAssistant.playChirp('click')"
              class="col-span-5 bg-green-500 hover:bg-green-600 text-white font-black text-xs md:text-sm py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all text-center"
            >
              <span class="text-base">💬</span>
              <span>${waLabel}</span>
            </a>

            <button 
              onclick="window.voiceAssistant.speak('${spokenText.replace(/'/g, "\\'")}', '${currentLang}')" 
              class="col-span-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl flex items-center justify-center text-base p-2 active:scale-90 transition-all"
              title="${isTe ? "వినండి" : "Listen Details"}"
            >
              🔊
            </button>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  const tabContainer = document.getElementById('teachers-grid-tab');
  if (tabContainer) {
    tabContainer.innerHTML = html;
  }
}

function renderLearnersList() {
  const container = document.getElementById('learners-grid');
  const countBadge = document.getElementById('learners-count-badge');
  if (!container) return;

  const isTe = (currentLang === 'te');

  let filtered = learners.filter(l => {
    if (currentCategoryFilter !== 'all' && l.skillWanted !== currentCategoryFilter) return false;
    if (currentVillageFilter !== 'all' && l.village !== currentVillageFilter && l.villageTe !== currentVillageFilter) return false;
    if (searchQuery) {
      const matchName = (l.name || '').toLowerCase().includes(searchQuery) || (l.nameTe || '').toLowerCase().includes(searchQuery);
      const matchTitle = (l.skillTitle || '').toLowerCase().includes(searchQuery) || (l.skillTitleTe || '').toLowerCase().includes(searchQuery);
      const matchVillage = (l.village || '').toLowerCase().includes(searchQuery) || (l.villageTe || '').toLowerCase().includes(searchQuery);
      if (!matchName && !matchTitle && !matchVillage) return false;
    }
    return true;
  });

  if (countBadge) {
    countBadge.textContent = isTe 
      ? `${filtered.length} విద్యార్థుల అభ్యర్థనలు` 
      : `${filtered.length} Learners Requesting`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8">
        <div class="text-5xl mb-3">🙋‍♂️</div>
        <h4 class="text-lg font-bold text-slate-800 mb-2">${isTe ? "ఏ అభ్యర్థనలు కనుగొనబడలేదు" : "No requests found"}</h4>
        <p class="text-slate-600 text-sm mb-4">${isTe ? "మీరు ఏదైనా నైపుణ్యం నేర్చుకోవాలనుకుంటున్నారా? మీ అభ్యర్థనను ఇక్కడే నమోదు చేయండి." : "Want to learn a skill? Post your learning request to connect with local mentors."}</p>
        <button onclick="openModal('add-learner-modal')" class="bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-md">
          ${isTe ? "➕ నేను నైపుణ్యం నేర్చుకోవాలనుకుంటున్నాను" : "➕ I Want to Learn a Skill"}
        </button>
      </div>
    `;
    return;
  }

  let html = '';
  filtered.forEach(l => {
    const cat = CATEGORIES_DEF.find(c => c.id === l.skillWanted) || {
      icon: "📘",
      color: "#2563eb",
      bgLight: "#dbeafe",
      name: "Skill",
      nameTe: "నైపుణ్యం"
    };

    const name = isTe ? (l.nameTe || l.name) : l.name;
    const role = isTe ? (l.roleTe || l.role) : l.role;
    const village = isTe ? (l.villageTe || l.village) : l.village;
    const skillTitle = isTe ? (l.skillTitleTe || l.skillTitle) : l.skillTitle;
    const budget = isTe ? (l.budgetTe || l.budget) : l.budget;
    const prefTime = isTe ? (l.preferredTimeTe || l.preferredTime) : l.preferredTime;
    const mode = isTe ? (l.learningModeTe || l.learningMode) : l.learningMode;

    const lookingLabel = isTe ? "నేర్చుకోవాలనుకున్నది:" : "Looking to Learn:";
    const budgetLabel = isTe ? "బడ్జెట్:" : "Budget:";
    const timeLabel = isTe ? "సమయం:" : "Preferred Time:";
    const modeLabel = isTe ? "మాధ్యమం:" : "Mode:";
    const teachCallLabel = isTe ? "నేను నేర్పిస్తాను (కాల్)" : "I Can Teach (Call)";

    const spokenText = isTe 
      ? `${name}, ${village} నుండి ${skillTitle} నేర్చుకోవాలనుకుంటున్నారు. బడ్జెట్: ${budget}. మీరు నేర్పించాలనుకుంటే కాల్ బటన్ నొక్కండి.`
      : `${name} from ${village} wants to learn ${skillTitle}. Budget is ${budget}. Click call button if you can mentor.`;

    html += `
      <div class="learner-card bg-white rounded-3xl border-2 border-blue-100 p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0" style="background-color: ${l.avatarBg || '#e0f2fe'}">
                ${l.avatar || '🙋'}
              </div>
              <div>
                <h4 class="font-extrabold text-slate-900 text-base leading-snug">${name}</h4>
                <div class="flex items-center gap-1.5 text-xs text-slate-500">
                  <span>${role}</span> • <span class="font-bold text-blue-700">📍 ${village}</span>
                </div>
              </div>
            </div>
            <div class="text-2xl p-2 rounded-xl" style="background-color: ${cat.bgLight}">
              ${cat.icon}
            </div>
          </div>

          <div class="bg-blue-50/70 p-3 rounded-2xl border border-blue-100 mb-3">
            <span class="text-[10px] font-bold text-blue-800 uppercase tracking-wider block mb-1">${lookingLabel}</span>
            <p class="font-bold text-slate-900 text-sm">${skillTitle}</p>
          </div>

          <div class="text-xs text-slate-600 space-y-1 mb-3">
            <div>💰 <b>${budgetLabel}</b> ${budget}</div>
            <div>⏰ <b>${timeLabel}</b> ${prefTime}</div>
            <div>🏫 <b>${modeLabel}</b> ${mode}</div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <a 
            href="tel:${l.phone}" 
            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm text-center"
          >
            <span>📞</span>
            <span>${teachCallLabel}</span>
          </a>
          <button 
            onclick="window.voiceAssistant.speak('${spokenText.replace(/'/g, "\\'")}', '${currentLang}')"
            class="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl p-2 text-base shrink-0"
            title="${isTe ? "వినండి" : "Listen"}"
          >
            🔊
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function setupModals() {
  const addTeacherForm = document.getElementById('add-teacher-form');
  if (addTeacherForm) {
    const skillSelect = document.getElementById('teacher-skill-select');
    if (skillSelect) {
      skillSelect.innerHTML = CATEGORIES_DEF.map(c => `
        <option value="${c.id}">${c.icon} ${c.name} (${c.nameTe})</option>
      `).join('');
    }

    addTeacherForm.addEventListener('submit', (e) => {
      e.preventDefault();
      window.voiceAssistant.playChirp('success');

      const name = document.getElementById('teacher-name').value;
      const skillId = document.getElementById('teacher-skill-select').value;
      const skillTitle = document.getElementById('teacher-skill-title').value;
      const village = document.getElementById('teacher-village-select').value;
      const location = document.getElementById('teacher-location').value;
      const phone = document.getElementById('teacher-phone').value;
      const feeNum = parseInt(document.getElementById('teacher-fee').value || '100', 10);
      const timing = document.getElementById('teacher-timing').value;
      const bio = document.getElementById('teacher-bio').value;

      const cat = CATEGORIES_DEF.find(c => c.id === skillId) || { icon: "⭐", bgLight: "#fef08a" };

      const newTeacher = {
        id: "t_" + Date.now(),
        name,
        nameTe: name,
        gender: "other",
        age: 30,
        skillId,
        skillTitle,
        skillTitleTe: skillTitle,
        village,
        villageTe: village,
        ward: location,
        locationDetails: location,
        locationDetailsTe: location,
        phone,
        fee: feeNum === 0 ? "Free (Skill Exchange)" : `₹${feeNum} / month`,
        feeTe: feeNum === 0 ? "ఉచితం (నైపుణ్య మార్పిడి)" : `₹${feeNum} / నెలకు`,
        feeNumber: feeNum,
        isFreeOrBarter: feeNum === 0,
        rating: 5.0,
        reviewsCount: 1,
        studentsTaught: 1,
        timing,
        timingTe: timing,
        experience: "Local Skilled Mentor",
        experienceTe: "గ్రామ నైపుణ్య గురువు",
        bio: bio || "Ready to teach skills to village students and neighbors.",
        bioTe: bio || "గ్రామ విద్యార్థులకు మరియు ప్రజలకు నైపుణ్యం నేర్పించడానికి సిద్ధంగా ఉన్నాను.",
        avatar: cat.icon,
        avatarBg: cat.bgLight,
        targetAudience: "All villagers and students",
        verified: true
      };

      teachers.unshift(newTeacher);
      setStoredData('teachers', teachers);

      // Link to current user's teach section
      if (currentUser) {
        if (!currentUser.teachSkills) currentUser.teachSkills = [];
        currentUser.teachSkills.push({
          skillId,
          skillTitle,
          skillTitleTe: skillTitle,
          learnersJoined: 1,
          monthlyFee: feeNum,
          moneyEarned: feeNum,
          joinedLearners: [
            { name: "First Enrolled Student", village: village, phone: "9811002233", status: "Active", feePaid: `₹${feeNum}` }
          ]
        });
        setCurrentUser(currentUser);
        const users = getStoredUsers();
        const idx = users.findIndex(u => u.id === currentUser.id);
        if (idx !== -1) {
          users[idx] = currentUser;
          saveStoredUsers(users);
        }
      }

      renderTeachersList();
      renderCategoryGrid();
      updateImpactDashboard(teachers, learners);
      closeModal('add-teacher-modal');
      addTeacherForm.reset();

      const congratMsg = (currentLang === 'te')
        ? `అభినందనలు ${name}! మీ వివరాలు గురువుగా నమోదు చేయబడ్డాయి. గ్రామ ప్రజలు ఇకపై మిమ్మల్ని సంప్రదించవచ్చు.`
        : `Congratulations ${name}! You are registered as a village mentor. Local learners can now contact you.`;
      window.voiceAssistant.speak(congratMsg, currentLang);
      switchTab('skills');
    });
  }

  const addLearnerForm = document.getElementById('add-learner-form');
  if (addLearnerForm) {
    const learnerSkillSelect = document.getElementById('learner-skill-select');
    if (learnerSkillSelect) {
      learnerSkillSelect.innerHTML = CATEGORIES_DEF.map(c => `
        <option value="${c.id}">${c.icon} ${c.name} (${c.nameTe})</option>
      `).join('');
    }

    addLearnerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      window.voiceAssistant.playChirp('success');

      const name = document.getElementById('learner-name').value;
      const role = document.getElementById('learner-role').value;
      const skillWanted = document.getElementById('learner-skill-select').value;
      const skillTitle = document.getElementById('learner-skill-title').value;
      const village = document.getElementById('learner-village').value;
      const budget = document.getElementById('learner-budget').value;
      const phone = document.getElementById('learner-phone').value;

      const newLearner = {
        id: "l_" + Date.now(),
        name,
        nameTe: name,
        role: role || "Village Resident",
        roleTe: role || "గ్రామవాసి",
        village,
        villageTe: village,
        skillWanted,
        skillTitle,
        skillTitleTe: skillTitle,
        budget: budget ? `₹${budget}/month` : "Affordable fee",
        budgetTe: budget ? `₹${budget}/నెలకు` : "అందుబాటు రుసుము",
        preferredTime: "Flexible time",
        preferredTimeTe: "అనుకూల సమయం",
        learningMode: "Offline (In-person village mentoring)",
        learningModeTe: "ఆఫ్‌లైన్ (గ్రామంలో ప్రత్యక్షంగా)",
        phone,
        avatar: "🙋",
        avatarBg: "#dbeafe",
        date: "Today",
        dateTe: "ఈ రోజే"
      };

      learners.unshift(newLearner);
      setStoredData('learners', learners);

      // Link to current user's learner section
      if (currentUser) {
        if (!currentUser.learnerRequests) currentUser.learnerRequests = [];
        currentUser.learnerRequests.unshift({
          id: "req_" + Date.now(),
          skillTitle,
          skillTitleTe: skillTitle,
          mentorName: "Assigned Village Mentor",
          mentorNameTe: "గ్రామ గురువు",
          village,
          date: "Today",
          budget: budget ? `₹${budget}/mo` : "₹100/mo",
          status: "Pending"
        });
        setCurrentUser(currentUser);
        const users = getStoredUsers();
        const idx = users.findIndex(u => u.id === currentUser.id);
        if (idx !== -1) {
          users[idx] = currentUser;
          saveStoredUsers(users);
        }
      }

      renderLearnersList();
      updateImpactDashboard(teachers, learners);
      closeModal('add-learner-modal');
      addLearnerForm.reset();

      const thankMsg = (currentLang === 'te')
        ? `ధన్యవాదాలు ${name}! మీ అభ్యాస అభ్యర్థన నమోదు చేయబడింది. స్థానిక గురువులు మిమ్మల్ని సంప్రదిస్తారు.`
        : `Thank you ${name}! Your learning request has been posted. Local teachers will reach out to you.`;
      window.voiceAssistant.speak(thankMsg, currentLang);
      switchTab('learners');
    });
  }
}

function openModal(modalId) {
  window.voiceAssistant.playChirp('click');
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = 'auto';
  }
}
