// Supabase Configuration - will be set via Netlify environment variables
if (typeof supabase === 'undefined') var supabase = null;

// Initialize Supabase when DOM is ready
function initializeSupabase() {
  try {
    // For production, these will be injected by Netlify
    // For local development, you need to create env-config.js
    const SUPABASE_URL = window.ENV?.SUPABASE_URL || process?.env?.SUPABASE_URL;
    const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY || process?.env?.SUPABASE_ANON_KEY;
    
    if (typeof window.supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('Supabase initialized successfully');
      return true;
    } else {
      console.log('Supabase credentials not available - using guest mode only');
      console.log('Supabase library available:', typeof window.supabase !== 'undefined');
      console.log('ENV available:', !!window.ENV);
      return false;
    }
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    return false;
  }
}

// Global state
if (typeof currentUser === 'undefined') var currentUser = null;
if (typeof isGuest === 'undefined') var isGuest = false;
if (typeof chatHistory === 'undefined') var chatHistory = [];
if (typeof recognition === 'undefined') var recognition = null;
if (typeof lastUserMessageId === 'undefined') var lastUserMessageId = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  // Clear all caches on load
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
  localStorage.removeItem('ui-cache');
  sessionStorage.clear();
  
  initializeApp();
});

async function initializeApp() {
  console.log('Initializing app...');
  
  // Initialize Supabase first
  const supabaseReady = initializeSupabase();
  
  // Set responsive placeholder
  setResponsivePlaceholder();
  window.addEventListener('resize', setResponsivePlaceholder);
  
  try {
    if (!supabaseReady || !supabase) {
      console.log('Supabase not available, using guest mode only');
      showAuthModal();
      setupEventListeners();
      initializeTheme();
      initializeSpeechRecognition();
      initializeSpeechSynthesis();
      return;
    }
    
    // Check if user is logged in with Supabase
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('Session check:', { session, error });
    
    if (session) {
      currentUser = session.user;
      console.log('User logged in:', currentUser);
      showApp();
    } else {
      console.log('No session found, showing auth modal');
      showAuthModal();
    }
    
    // Listen for auth changes
    if (supabase) {
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state change:', event, session);
        
        if (event === 'SIGNED_IN') {
          currentUser = session.user;
          isGuest = false;
          // Force reload to ensure fresh UI
          window.location.reload(true);
        } else if (event === 'SIGNED_OUT' && !isGuest) {
          // Only redirect to login if not in guest mode
          currentUser = null;
          showAuthModal();
        }
      });
    }
    
  } catch (error) {
    console.error('Error initializing app:', error);
    showAuthModal();
  }
  
  setupEventListeners();
  initializeTheme();
  initializeSpeechRecognition();
  initializeSpeechSynthesis();
}

function initializeSpeechSynthesis() {
  if ('speechSynthesis' in window) {
    // Force voice loading
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        console.log(`Loaded ${voices.length} voices for speech synthesis`);
        return true;
      }
      return false;
    };
    
    // Try to load voices immediately
    if (!loadVoices()) {
      // If voices not loaded, wait for the event
      window.speechSynthesis.onvoiceschanged = () => {
        loadVoices();
      };
      
      // Fallback: trigger voice loading
      setTimeout(() => {
        if (window.speechSynthesis.getVoices().length === 0) {
          // Some browsers need a dummy utterance to load voices
          const dummy = new SpeechSynthesisUtterance('');
          window.speechSynthesis.speak(dummy);
          window.speechSynthesis.cancel();
        }
      }, 100);
    }
  }
}

// Authentication
function showAuthModal() {
  document.getElementById('auth-modal').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function showApp() {
  document.getElementById('auth-modal').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  
  // Force UI refresh by clearing any cached states
  localStorage.removeItem('ui-cache');
  
  if (currentUser) {
    document.getElementById('user-name').textContent = currentUser.name || currentUser.email;
    loadUserHistory();
  } else {
    document.getElementById('user-name').textContent = 'Guest User';
  }
  
  // Set time-based greeting
  setTimeBasedGreeting();
  
  // Clear any existing chat messages when switching users
  document.getElementById('chat-messages').innerHTML = '';
  chatHistory = [];
}

function setupEventListeners() {
  console.log('Setting up event listeners...');
  
  try {
    // Auth buttons
    const googleBtn = document.getElementById('google-signin');
    const emailBtn = document.getElementById('email-signin');
    const emailSignupBtn = document.getElementById('email-signup');
    const guestBtn = document.getElementById('guest-btn');
    
    if (googleBtn) googleBtn.addEventListener('click', handleGoogleSignIn);
    if (emailBtn) emailBtn.addEventListener('click', () => showEmailForm('signin'));
    if (emailSignupBtn) emailSignupBtn.addEventListener('click', () => showEmailForm('signup'));
    if (guestBtn) guestBtn.addEventListener('click', continueAsGuest);
    
    // Email form
    const emailSubmit = document.getElementById('email-submit');
    const backBtn = document.getElementById('back-to-options');
    const toggleMode = document.getElementById('toggle-mode');
    
    if (emailSubmit) emailSubmit.addEventListener('click', handleEmailAuth);
    if (backBtn) backBtn.addEventListener('click', showAuthOptions);
    if (toggleMode) toggleMode.addEventListener('click', toggleAuthMode);
    
    console.log('Auth event listeners set up successfully');
    
  } catch (error) {
    console.error('Error setting up auth listeners:', error);
  }
  
  // Debug: Check if Supabase is loaded
  console.log('Supabase client:', supabase);
  console.log('ENV available:', !!window.ENV);
  
  // Main app
  // Main app listeners - only add if elements exist
  const sendBtn = document.getElementById('send-button');
  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  
  const ambulanceBtn = document.getElementById('ambulance-button');
  if (ambulanceBtn) ambulanceBtn.addEventListener('click', openHospitalModal);
  
  const healthIssueInput = document.getElementById('health-issue');
  if (healthIssueInput) {
    healthIssueInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
  
  const micBtn = document.getElementById('mic-button');
  if (micBtn) micBtn.addEventListener('click', toggleVoiceInput);
  
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
  
  const historyBtn = document.getElementById('history-toggle');
  if (historyBtn) historyBtn.addEventListener('click', toggleHistory);
  
  const clearBtn = document.getElementById('clear-chat');
  if (clearBtn) clearBtn.addEventListener('click', clearChat);
  
  const shareBtn = document.getElementById('share-chat');
  if (shareBtn) shareBtn.addEventListener('click', shareChat);
  
  // Side panel functionality
  const sideMenuBtn = document.getElementById('side-menu-toggle');
  if (sideMenuBtn) sideMenuBtn.addEventListener('click', toggleSidePanel);
  
  const closePanelBtn = document.getElementById('close-panel');
  if (closePanelBtn) closePanelBtn.addEventListener('click', closeSidePanel);
  
  const panelOverlay = document.getElementById('panel-overlay');
  if (panelOverlay) panelOverlay.addEventListener('click', closeSidePanel);
  
  const closeHistoryBtn = document.getElementById('close-history');
  if (closeHistoryBtn) closeHistoryBtn.addEventListener('click', closeHistoryPanel);
  
  // Hospital modal event listeners
  const closeHospitalBtn = document.getElementById('close-hospital-modal');
  if (closeHospitalBtn) closeHospitalBtn.addEventListener('click', closeHospitalModal);
  
  const hospitalModal = document.getElementById('hospital-modal');
  if (hospitalModal) {
    hospitalModal.addEventListener('click', (e) => {
      if (e.target.id === 'hospital-modal') {
        closeHospitalModal();
      }
    });
  }
}

let isSignUpMode = false;

function showEmailForm(mode = 'signin') {
  console.log('Showing email form:', mode);
  try {
    isSignUpMode = mode === 'signup';
    
    document.querySelector('.auth-options').classList.add('hidden');
    document.getElementById('email-form').classList.remove('hidden');
    
    updateFormMode();
  } catch (error) {
    console.error('Error showing email form:', error);
  }
}

function updateFormMode() {
  const formTitle = document.getElementById('form-title');
  const submitBtn = document.getElementById('email-submit');
  const toggleText = document.getElementById('toggle-text');
  const toggleBtn = document.getElementById('toggle-mode');
  const confirmPasswordGroup = document.getElementById('confirm-password-group');
  
  if (isSignUpMode) {
    formTitle.textContent = 'Sign Up';
    submitBtn.textContent = 'Sign Up';
    toggleText.textContent = 'Already have an account?';
    toggleBtn.textContent = 'Sign in';
    confirmPasswordGroup.classList.remove('hidden');
  } else {
    formTitle.textContent = 'Sign In';
    submitBtn.textContent = 'Sign In';
    toggleText.textContent = "Don't have an account?";
    toggleBtn.textContent = 'Sign up';
    confirmPasswordGroup.classList.add('hidden');
  }
}

function toggleAuthMode() {
  isSignUpMode = !isSignUpMode;
  updateFormMode();
  
  // Clear form
  document.getElementById('auth-email').value = '';
  document.getElementById('auth-password').value = '';
  document.getElementById('confirm-password').value = '';
}

function showAuthOptions() {
  console.log('Showing auth options');
  try {
    document.querySelector('.auth-options').classList.remove('hidden');
    document.getElementById('email-form').classList.add('hidden');
    document.getElementById('auth-title').textContent = 'Welcome to PreAid';
    document.getElementById('auth-subtitle').textContent = 'Your trusted health companion';
  } catch (error) {
    console.error('Error showing auth options:', error);
  }
}

async function handleEmailAuth() {
  console.log('Email auth clicked, mode:', isSignUpMode ? 'signup' : 'signin');
  
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const submitBtn = document.getElementById('email-submit');
  
  if (!email || !password) {
    alert('Please enter both email and password');
    return;
  }
  
  if (isSignUpMode && password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }
  
  if (isSignUpMode && password.length < 6) {
    alert('Password must be at least 6 characters long');
    return;
  }
  
  if (!supabase) {
    alert('Authentication service not available. Please try guest mode.');
    return;
  }
  
  const originalText = submitBtn.textContent;
  submitBtn.textContent = isSignUpMode ? 'Creating account...' : 'Signing in...';
  submitBtn.disabled = true;
  
  try {
    let data, error;
    
    if (isSignUpMode) {
      console.log('Attempting sign-up for:', email);
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      data = signUpData;
      error = signUpError;
      
      console.log('Sign-up response:', { data, error });
      
      if (error) {
        alert('Sign-up error: ' + error.message);
        return;
      }
      
      if (data.user && !data.session) {
        alert('Account created successfully! Please check your email to verify your account before signing in.');
        // Switch to sign-in mode
        isSignUpMode = false;
        updateFormMode();
        return;
      }
    } else {
      console.log('Attempting sign-in for:', email);
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      data = signInData;
      error = signInError;
      
      console.log('Sign-in response:', { data, error });
      
      if (error) {
        console.error('Email sign-in detailed error:', error);
        if (error.message.includes('Invalid login credentials')) {
          alert('Invalid email or password. Please check your credentials or sign up for a new account.');
        } else if (error.message.includes('Email not confirmed')) {
          alert('Please check your email and click the verification link before signing in.');
        } else if (error.message.includes('signup_disabled')) {
          alert('New user registration is disabled. Please contact support.');
        } else if (error.message.includes('email_address_invalid')) {
          alert('Please enter a valid email address.');
        } else {
          alert('Sign-in error: ' + error.message + '\n\nError code: ' + (error.status || 'Unknown'));
        }
        return;
      }
    }
    
    if (data.user) {
      currentUser = data.user;
      console.log('Authentication successful:', currentUser);
      showApp();
    }
    
  } catch (error) {
    console.error('Email auth error:', error);
    alert('An error occurred: ' + error.message);
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

function continueAsGuest() {
  console.log('Guest mode selected');
  try {
    isGuest = true;
    currentUser = null;
    
    // Hide auth modal
    const authModal = document.getElementById('auth-modal');
    const app = document.getElementById('app');
    
    if (authModal && app) {
      authModal.classList.add('hidden');
      app.classList.remove('hidden');
      
      // Set user name
      const userName = document.getElementById('user-name');
      if (userName) {
        userName.textContent = 'Guest User';
      }
      
      // Set greeting
      setTimeBasedGreeting();
      
      console.log('Guest mode activated successfully');
    } else {
      console.error('Required elements not found');
    }
  } catch (error) {
    console.error('Error in continueAsGuest:', error);
  }
}

async function handleGoogleSignIn() {
  console.log('Google sign-in attempted');
  
  if (!supabase) {
    alert('Authentication service not available. Please try guest mode.');
    return;
  }
  
  try {
    console.log('Attempting Google OAuth...');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
    
    console.log('Google OAuth response:', { data, error });
    
    if (error) {
      console.error('Google sign-in error:', error);
      alert('Google sign-in failed: ' + error.message + '\n\nPlease configure Google OAuth in your Supabase project or use email sign-in.');
    }
  } catch (error) {
    console.error('Google sign-in exception:', error);
    alert('Google sign-in not configured. Please use email sign-in or guest mode.');
  }
}

async function logout() {
  if (supabase) {
    await supabase.auth.signOut();
  }
  currentUser = null;
  isGuest = false;
  chatHistory = [];
  document.getElementById('chat-messages').innerHTML = '';
  document.getElementById('history-panel').classList.add('hidden');
  showAuthModal();
}

// Chat functionality
async function sendMessage() {
  const input = document.getElementById('health-issue');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Handle layout transition on first message
  const heroSection = document.querySelector('.hero-section');
  const chatContainer = document.querySelector('.chat-container');
  const mainContent = document.querySelector('.main-content');
  const messagesContainer = document.getElementById('chat-messages');
  
  if (messagesContainer.children.length === 0) {
    heroSection.classList.add('hidden');
    chatContainer.classList.add('has-messages');
    mainContent.classList.add('has-messages');
  } else {
    // Move current conversation to history and clear chat for new conversation
    const currentConversation = Array.from(messagesContainer.children)
      .filter(msg => !msg.querySelector('.loading'))
      .map(msg => ({
        content: msg.querySelector('.message-text')?.textContent || '',
        sender: msg.classList.contains('user') ? 'user' : 'ai',
        time: msg.querySelector('.message-time')?.textContent || ''
      }));
    
    if (currentConversation.length > 0) {
      chatHistory.push(...currentConversation);
    }
    
    messagesContainer.innerHTML = '';
  }
  
  // Add user message and store its ID
  lastUserMessageId = addMessage(message, 'user');
  input.value = '';
  
  // Show thinking animation
  const loadingId = addMessage('🤔 Analyzing your symptoms...', 'ai', true);
  
  try {
    const advice = await getGeminiAdvice(message);
    
    document.getElementById(loadingId).remove();
    
    if (advice) {
      addMessageWithTypewriter(advice, 'ai');
      saveToLocalHistory(message, advice);
    } else {
      throw new Error('No advice generated');
    }
  } catch (error) {
    document.getElementById(loadingId).remove();
    const offlineAdvice = getOfflineHealthAdvice(message);
    addMessageWithTypewriter('🏥 **PreAid Offline Mode** - ' + offlineAdvice, 'ai');
  }
}

// Global variables for history analysis timeout
if (typeof lastQuestion === 'undefined') var lastQuestion = '';
if (typeof consecutiveQuestionCount === 'undefined') var consecutiveQuestionCount = 0;
if (typeof partialHistoryUsed === 'undefined') var partialHistoryUsed = false;

async function getGeminiAdvice(issue) {
  try {
    console.log('Trying direct AI API...');
    const advice = await callDirectAI(issue);
    console.log('Direct AI success!');
    return advice;
  } catch (error) {
    console.log('Direct AI failed:', error.message);
    console.log('Falling back to offline advice...');
    throw error;
  }
}

async function saveToLocalHistory(issue, advice) {
  if (isGuest || !currentUser || !supabase) return;
  
  try {
    const { error } = await supabase
      .from('health_history')
      .insert({
        user_id: currentUser.id,
        issue,
        advice,
        is_personal: isPersonalSymptom(issue)
      });
    
    if (error) {
      console.error('Error saving history:', error);
    }
  } catch (error) {
    console.error('Error saving to database:', error);
  }
}

async function getRelevantHistoryWithTimeout(currentIssue) {
  if (isGuest || !currentUser) return { history: [], isPartial: false };
  
  // If this is a consecutive question and we want full analysis
  if (consecutiveQuestionCount >= 2) {
    console.log('Full history analysis requested');
    return await getFullRelevantHistory(currentIssue);
  }
  
  // Quick analysis with 10-second timeout
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      console.log('History analysis timed out, using partial results');
      resolve({ history: [], isPartial: true });
    }, 10000);
  });
  
  const historyPromise = getRelevantHistory(currentIssue);
  
  try {
    const result = await Promise.race([historyPromise, timeoutPromise]);
    
    if (Array.isArray(result)) {
      return { history: result, isPartial: false };
    } else {
      partialHistoryUsed = true;
      return result; // This is the timeout result
    }
  } catch (error) {
    console.error('Error in history analysis:', error);
    return { history: [], isPartial: true };
  }
}

async function getRelevantHistory(currentIssue) {
  try {
    const { data: history, error } = await supabase
      .from('health_history')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error || !history) return [];
    
    const now = new Date();
    
    return history
      .filter(item => {
        const itemDate = new Date(item.created_at);
        const daysDiff = Math.floor((now - itemDate) / (1000 * 60 * 60 * 24));
        const impactDuration = getConditionImpactDuration(item.issue);
        
        return daysDiff <= impactDuration && 
               item.is_personal !== false && 
               isPersonalSymptom(currentIssue) &&
               (isRelatedSymptom(item.issue, currentIssue) || isHighImpactCondition(item.issue));
      })
      .map(item => ({
        issue: item.issue,
        timeAgo: getTimeAgo(item.created_at)
      }))
      .slice(-3);
  } catch (error) {
    console.error('Error getting relevant history:', error);
    return [];
  }
}

async function getFullRelevantHistory(currentIssue) {
  try {
    console.log('Performing full history analysis...');
    
    const { data: history, error } = await supabase
      .from('health_history')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(50); // More comprehensive analysis
    
    if (error || !history) return { history: [], isPartial: false };
    
    const now = new Date();
    
    const relevantHistory = history
      .filter(item => {
        const itemDate = new Date(item.created_at);
        const daysDiff = Math.floor((now - itemDate) / (1000 * 60 * 60 * 24));
        const impactDuration = getConditionImpactDuration(item.issue);
        
        return daysDiff <= impactDuration && 
               item.is_personal !== false && 
               isPersonalSymptom(currentIssue) &&
               (isRelatedSymptom(item.issue, currentIssue) || isHighImpactCondition(item.issue));
      })
      .map(item => ({
        issue: item.issue,
        timeAgo: getTimeAgo(item.created_at)
      }))
      .slice(-5); // More history items for full analysis
    
    return { history: relevantHistory, isPartial: false };
  } catch (error) {
    console.error('Error in full history analysis:', error);
    return { history: [], isPartial: true };
  }
}

function getConditionImpactDuration(condition) {
  const longTermConditions = {
    surgery: 90, // 3 months
    fracture: 60, // 2 months  
    injury: 30, // 1 month
    chronic: 365, // 1 year
    infection: 14 // 2 weeks
  };
  
  const text = condition.toLowerCase();
  
  if (text.includes('surgery') || text.includes('operation')) return longTermConditions.surgery;
  if (text.includes('fracture') || text.includes('broken') || text.includes('cast')) return longTermConditions.fracture;
  if (text.includes('injury') || text.includes('accident') || text.includes('trauma')) return longTermConditions.injury;
  if (text.includes('chronic') || text.includes('diabetes') || text.includes('hypertension') || text.includes('arthritis')) return longTermConditions.chronic;
  if (text.includes('infection') || text.includes('pneumonia') || text.includes('uti')) return longTermConditions.infection;
  
  return 7; // Default 1 week for minor symptoms
}

function isHighImpactCondition(condition) {
  const highImpactKeywords = ['surgery', 'operation', 'fracture', 'broken', 'injury', 'accident', 'chronic', 'diabetes', 'hypertension', 'heart', 'stroke', 'cancer', 'pneumonia'];
  return highImpactKeywords.some(keyword => condition.toLowerCase().includes(keyword));
}

function isPersonalSymptom(text) {
  const personalIndicators = /\b(i have|i feel|i am|my |me |myself|i'm|i've|i get|i experience)/i;
  const otherPersonIndicators = /\b(someone|person|he|she|they|patient|victim|collapsed|unconscious|found)/i;
  
  if (otherPersonIndicators.test(text)) return false;
  return personalIndicators.test(text) || !otherPersonIndicators.test(text);
}

function isRelatedSymptom(oldSymptom, newSymptom) {
  const symptomGroups = {
    head: ['headache', 'migraine', 'dizziness', 'dizzy', 'head pain', 'temple', 'nosebleed', 'nose bleed'],
    respiratory: ['cough', 'breathing', 'chest', 'lungs', 'shortness of breath', 'wheezing'],
    digestive: ['stomach', 'nausea', 'vomit', 'diarrhea', 'abdominal', 'belly'],
    circulatory: ['heart', 'chest pain', 'palpitations', 'blood pressure', 'circulation', 'nosebleed', 'bleeding'],
    musculoskeletal: ['back pain', 'joint', 'muscle', 'bone', 'spine', 'neck', 'knee', 'shoulder', 'hip'],
    skin: ['rash', 'itch', 'skin', 'burn', 'cut', 'wound'],
    neurological: ['headache', 'dizziness', 'numbness', 'tingling', 'seizure', 'confusion'],
    general: ['fever', 'fatigue', 'tired', 'weakness', 'pain']
  };
  
  const old = oldSymptom.toLowerCase();
  const current = newSymptom.toLowerCase();
  
  // Direct symptom progression (nosebleed -> dizziness)
  const progressions = {
    'nosebleed': ['dizziness', 'dizzy', 'headache', 'weakness', 'fatigue'],
    'surgery': ['pain', 'swelling', 'infection', 'weakness'],
    'fracture': ['pain', 'swelling', 'stiffness', 'weakness']
  };
  
  for (const [condition, symptoms] of Object.entries(progressions)) {
    if (old.includes(condition) && symptoms.some(s => current.includes(s))) return true;
  }
  
  for (const group of Object.values(symptomGroups)) {
    const oldInGroup = group.some(symptom => old.includes(symptom));
    const currentInGroup = group.some(symptom => current.includes(symptom));
    if (oldInGroup && currentInGroup) return true;
  }
  
  return false;
}

function getTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  
  if (diffHours < 1) return 'just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  return `${diffMonths}mo ago`;
}

function getOfflineHealthAdvice(message) {
  const msg = message.toLowerCase();
  
  // Check if question is health-related
  const healthKeywords = ['pain', 'hurt', 'ache', 'sick', 'fever', 'cough', 'headache', 'stomach', 'nausea', 'dizzy', 'tired', 'symptom', 'medicine', 'doctor', 'hospital', 'health', 'feel', 'sore', 'infection', 'injury', 'cut', 'wound', 'bleeding', 'swollen', 'rash', 'itch', 'cpr', 'choking', 'unconscious', 'breathing', 'chest pain', 'heart attack', 'stroke', 'seizure', 'fracture', 'broken', 'spinal', 'neck injury'];
  const isHealthRelated = healthKeywords.some(keyword => msg.includes(keyword));
  
  // Check for high-risk procedures that need safety warnings
  const highRiskKeywords = ['cpr', 'choking', 'heimlich', 'unconscious', 'not breathing', 'chest compressions', 'fracture', 'broken bone', 'spinal', 'neck injury', 'severe bleeding', 'deep cut', 'medication', 'pills', 'injection'];
  const isHighRisk = highRiskKeywords.some(keyword => msg.includes(keyword));
  

  
  if (!isHealthRelated) {
    return "**<u>This ain't a medical emergency!</u>** 😄 But hey, I'll help anyway! While I'm designed to help with health concerns, I can see you're asking about something else. For the best answer to non-medical questions, try asking a general AI assistant or search engine. Now, is there anything health-related I can help you with today?\n\n⚠️ **Disclaimer:** I'm an AI assistant providing general information only. Always consult qualified healthcare professionals for proper medical diagnosis and treatment. Professional medical advice takes priority over AI suggestions.";
  }
  
  if (msg.includes('headache') || msg.includes('head pain') || msg.includes('migraine')) {
    return "I understand headaches can be really uncomfortable.\n\n**🆘 SEEK IMMEDIATE HELP IF:** Sudden/severe headache, fever, stiff neck, vision changes, or after head injury.\n\n**Immediate Relief:**\n• Rest in a quiet, dark room\n• Apply a cold compress to your forehead or warm compress to neck\n• Stay well hydrated\n• Gentle neck and shoulder stretches\n\n⚠️ **Disclaimer:** I'm an AI assistant providing general information only. Always consult qualified healthcare professionals for proper medical diagnosis and treatment. Professional medical advice takes priority over AI suggestions.";
  }
  
  if (msg.includes('fever') || msg.includes('temperature') || msg.includes('hot') || msg.includes('chills')) {
    return "Fever can make you feel awful, but it's often your body fighting infection.\n\n**🆘 SEEK IMMEDIATE CARE IF:** Fever >103°F (39.4°C), lasts >3 days, or with severe symptoms like difficulty breathing.\n\n**Care steps:**\n• Rest and drink plenty of fluids\n• Use fever reducers as directed (acetaminophen/ibuprofen)\n• Wear light, breathable clothing\n• Take lukewarm baths or use cool cloths\n\n⚠️ **Disclaimer:** I'm an AI assistant providing general information only. Always consult qualified healthcare professionals for proper medical diagnosis and treatment. Professional medical advice takes priority over AI suggestions.";
  }
  
  if (msg.includes('cough') || msg.includes('throat') || msg.includes('sore')) {
    return "Throat discomfort and coughs can be really bothersome.\n\n**🆘 SEE A DOCTOR IF:** Symptoms persist >1 week, severe difficulty swallowing, or breathing problems.\n\n**Soothing remedies:**\n• Warm liquids (tea with honey, warm salt water gargle)\n• Throat lozenges or hard candies\n• Use a humidifier or breathe steam\n• Rest your voice\n\n⚠️ **Disclaimer:** I'm an AI assistant providing general information only. Always consult qualified healthcare professionals for proper medical diagnosis and treatment. Professional medical advice takes priority over AI suggestions.";
  }
  
  if (msg.includes('stomach') || msg.includes('nausea') || msg.includes('vomit') || msg.includes('diarrhea')) {
    return "Stomach troubles are never fun.\n\n**🆘 GET MEDICAL HELP FOR:** Severe dehydration, blood in vomit/stool, high fever, or symptoms lasting >2 days.\n\n**Gentle approach:**\n• Small, frequent sips of clear fluids\n• BRAT diet when ready (bananas, rice, applesauce, toast)\n• Avoid dairy, fatty, or spicy foods\n• Rest and let your stomach settle\n\n⚠️ **Disclaimer:** I'm an AI assistant providing general information only. Always consult qualified healthcare professionals for proper medical diagnosis and treatment. Professional medical advice takes priority over AI suggestions.";
  }
  
  if (msg.includes('pain') || msg.includes('hurt') || msg.includes('ache')) {
    return "I'm sorry you're experiencing pain.\n\n**🆘 CONSULT A HEALTHCARE PROVIDER FOR:** Severe, persistent, or worsening pain.\n\n**Pain management:**\n• Rest the affected area\n• Apply ice for acute injuries, heat for muscle tension\n• Over-the-counter pain relievers if appropriate\n• Gentle movement as tolerated\n\n⚠️ **Disclaimer:** I'm an AI assistant providing general information only. Always consult qualified healthcare professionals for proper medical diagnosis and treatment. Professional medical advice takes priority over AI suggestions.";
  }
  
  if (msg.includes('cut') || msg.includes('wound') || msg.includes('bleeding')) {
    return "🚨 **SAFETY WARNING:** Incorrect pressure application or wound cleaning can worsen bleeding or cause infection. Only attempt if bleeding is minor and you can see the wound clearly.\n\n📞 **EMERGENCY NUMBERS (INDIA):** 108 (Emergency), 102 (Ambulance)\n\n**🆘 SEEK IMMEDIATE CARE FOR:** Deep cuts, excessive bleeding, signs of infection, or if you can't clean the wound properly.\n\n**First aid steps for minor cuts:**\n• Clean your hands first\n• Apply direct pressure to stop bleeding\n• Clean wound gently with water\n• Apply antibiotic ointment and bandage\n• Keep wound clean and dry\n\n⚠️ **Disclaimer:** I'm an AI assistant providing general information only. Always consult qualified healthcare professionals for proper medical diagnosis and treatment. Professional medical advice takes priority over AI suggestions.";
  }
  
  // General health advice based on keywords
  if (msg.includes('cold') || msg.includes('flu') || msg.includes('runny nose') || msg.includes('sneezing')) {
    return "Common cold symptoms can be managed with rest and care.\n\n**🆘 SEE A DOCTOR IF:** High fever (>101°F), symptoms worsen after 7 days, or difficulty breathing.\n\n**Care steps:**\n• Get plenty of rest and sleep\n• Drink warm liquids (tea, soup, warm water)\n• Use a humidifier or breathe steam from hot shower\n• Gargle with warm salt water for sore throat\n• Eat nutritious foods to support immune system\n\n⚠️ **Disclaimer:** I'm an AI assistant providing general information only. Always consult qualified healthcare professionals for proper medical diagnosis and treatment.";
  }
  
  return "Thank you for reaching out about your health concern. While I'm in offline mode, here's some general guidance:\n\n**General care:**\n• Monitor your symptoms carefully\n• Stay well hydrated with water\n• Get adequate rest and sleep\n• Maintain good hygiene\n• Eat nutritious foods\n• Avoid strenuous activity if feeling unwell\n\n**🆘 SEEK MEDICAL CARE IF:**\n• Symptoms are severe or worsening\n• You have a high fever (>101°F/38.3°C)\n• You experience difficulty breathing\n• You have severe pain\n• You're concerned about your symptoms\n\n⚠️ **Disclaimer:** I'm an AI assistant providing general information only. Always consult qualified healthcare professionals for proper medical diagnosis and treatment.";
}

function getSpecificEmergencyAdvice(msg) {
  if (msg.includes('chest pain') || msg.includes('heart attack')) {
    return "**For chest pain/heart attack:**\n• Have the person sit down and rest\n• Loosen tight clothing around neck and chest\n• If conscious and not allergic, give 1 aspirin to chew (if available)\n• Monitor breathing and pulse\n• Be ready to perform CPR if person becomes unconscious";
  }
  
  if (msg.includes('choking')) {
    return "**For choking (conscious person):**\n• Encourage coughing if they can still breathe\n• Give 5 back blows between shoulder blades with heel of hand\n• If unsuccessful, perform 5 abdominal thrusts (Heimlich maneuver)\n• Alternate between back blows and abdominal thrusts\n• If person becomes unconscious, begin CPR";
  }
  
  return "**General emergency care:**\n• Keep the person calm and still\n• Monitor breathing and consciousness\n• Do not give food or water\n• Keep the person warm but not overheated\n• Stay with them until help arrives";
}

function addMessage(content, sender, isLoading = false) {
  const messagesContainer = document.getElementById('chat-messages');
  const messageId = 'msg-' + Date.now();
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  messageDiv.id = messageId;
  
  const avatar = sender === 'user' ? 
    `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
       <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
       <circle cx="12" cy="7" r="4"/>
     </svg>` : 
    `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
       <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
     </svg>`;
  
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  messageDiv.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-content">
      ${isLoading ? `
        <div class="loading">
          <span>${content}</span>
          <div class="loading-dots">
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
          </div>
        </div>
      ` : `
        <div class="message-text">${formatMessage(content)}</div>
        ${sender === 'ai' && !isLoading ? `
          <div class="message-actions">
            <div class="speech-controls">
              <button class="speak-btn" onclick="toggleSpeech('${messageId}')" title="Play/Pause speech">
                <svg class="play-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
                <svg class="pause-icon hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
              </button>
              <div class="speed-control">
                <label>Speed:</label>
                <input type="range" class="speed-slider" min="0.5" max="2" step="0.1" value="1">
                <span class="speed-value">1x</span>
              </div>
            </div>
            <button class="copy-btn" onclick="copyMessage('${messageId}')" title="Copy advice">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
          </div>
        ` : ''}
        <div class="message-time">${time}</div>
      `}
    </div>
  `;
  
  messagesContainer.appendChild(messageDiv);
  
  // No auto-scroll here - handled by typewriter or user message scroll
  // setTimeout(() => {
  //   messagesContainer.scrollTop = messagesContainer.scrollHeight;
  // }, 100);
  
  // Add to chat history
  if (!isLoading) {
    chatHistory.push({ content, sender, time });
  }
  
  // Setup speed control for AI messages
  if (sender === 'ai' && !isLoading) {
    const speedSlider = messageDiv.querySelector('.speed-slider');
    const speedValue = messageDiv.querySelector('.speed-value');
    
    if (speedSlider && speedValue) {
      // Load saved speed
      const savedSpeed = localStorage.getItem('speech-speed') || '1';
      speedSlider.value = savedSpeed;
      speedValue.textContent = savedSpeed + 'x';
      
      speedSlider.addEventListener('input', (e) => {
        const speed = parseFloat(e.target.value);
        speedValue.textContent = speed + 'x';
        localStorage.setItem('speech-speed', speed);
        
        // If currently speaking this message, update rate immediately
        if (currentMessageId === messageId && currentUtterance) {
          currentUtterance.rate = speed;
        }
      });
    }
  }
  
  return messageId;
}

function addMessageWithTypewriter(content, sender) {
  const messageId = addMessage('', sender, false);
  const messageElement = document.getElementById(messageId);
  const textElement = messageElement.querySelector('.message-text');
  
  let index = 0;
  const formattedContent = formatMessage(content);
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = formattedContent;
  const plainText = tempDiv.textContent || tempDiv.innerText || '';
  
  // Scroll to user message and keep it fixed there
  scrollToUserMessage();
  
  function typeWriter() {
    if (index < plainText.length) {
      const currentText = plainText.substring(0, index + 1);
      textElement.innerHTML = formatMessage(currentText);
      index++;
      
      // Keep scroll fixed at user message while typing
      scrollToUserMessage();
      
      setTimeout(typeWriter, 15);
    } else {
      textElement.innerHTML = formattedContent;
    }
  }
  
  typeWriter();
  return messageId;
}

function scrollToUserMessage() {
  if (lastUserMessageId) {
    const userMessage = document.getElementById(lastUserMessageId);
    const messagesContainer = document.getElementById('chat-messages');
    
    if (userMessage && messagesContainer) {
      const userMessageTop = userMessage.offsetTop;
      messagesContainer.scrollTop = userMessageTop - 20; // Small offset for better visibility
    }
  }
}

function formatMessage(text) {
  // Basic markdown-like formatting
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
    .replace(/- (.*?)(?=\n|$)/g, '• $1');
}

// Speech functionality
if (typeof currentUtterance === 'undefined') var currentUtterance = null;
if (typeof currentMessageId === 'undefined') var currentMessageId = null;
if (typeof isPaused === 'undefined') var isPaused = false;
if (typeof speedChangeTimeout === 'undefined') var speedChangeTimeout = null;
if (typeof currentText === 'undefined') var currentText = '';
if (typeof currentPosition === 'undefined') var currentPosition = 0;

function toggleSpeech(messageId) {
  const messageElement = document.getElementById(messageId);
  const speakBtn = messageElement.querySelector('.speak-btn');
  const playIcon = speakBtn.querySelector('.play-icon');
  const pauseIcon = speakBtn.querySelector('.pause-icon');
  
  if (!('speechSynthesis' in window)) {
    alert('Text-to-speech not supported in your browser');
    return;
  }
  
  // If currently speaking this message
  if (currentMessageId === messageId && currentUtterance) {
    if (window.speechSynthesis.paused || isPaused) {
      // Resume speech
      window.speechSynthesis.resume();
      isPaused = false;
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
    } else if (window.speechSynthesis.speaking) {
      // Pause speech
      window.speechSynthesis.pause();
      isPaused = true;
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
    }
    return;
  }
  
  // Stop any current speech and start new one
  window.speechSynthesis.cancel();
  resetAllSpeechButtons();
  
  // Start new speech
  startSpeechWithVoices(messageId);
}

function startSpeechWithVoices(messageId) {
  const messageElement = document.getElementById(messageId);
  const textElement = messageElement.querySelector('.message-text');
  const text = textElement.textContent;
  const speedSlider = messageElement.querySelector('.speed-slider');
  const speed = parseFloat(speedSlider.value);
  
  startSpeech(messageId, text, speed);
}

function startSpeech(messageId, text, speed) {
  const messageElement = document.getElementById(messageId);
  const speakBtn = messageElement.querySelector('.speak-btn');
  const playIcon = speakBtn.querySelector('.play-icon');
  const pauseIcon = speakBtn.querySelector('.pause-icon');
  
  // Clean text for more natural speech
  const cleanText = cleanTextForSpeech(text);
  
  currentUtterance = new SpeechSynthesisUtterance(cleanText);
  
  // Get better voice with proper settings
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = selectBestVoice(voices);
  if (preferredVoice) {
    currentUtterance.voice = preferredVoice;
  }
  
  // Natural speech settings
  currentUtterance.rate = speed;
  currentUtterance.pitch = 0.9; // Slightly lower pitch for medical advice
  currentUtterance.volume = 0.8;
  
  currentMessageId = messageId;
  currentText = text;
  isPaused = false;
  
  // Update UI
  playIcon.classList.add('hidden');
  pauseIcon.classList.remove('hidden');
  speakBtn.style.color = 'var(--primary-color)';
  
  currentUtterance.onend = () => {
    resetSpeechButton(messageId);
    currentUtterance = null;
    currentMessageId = null;
    currentText = '';
  };
  
  currentUtterance.onerror = () => {
    resetSpeechButton(messageId);
    currentUtterance = null;
    currentMessageId = null;
    currentText = '';
  };
  
  // Actually start speaking
  window.speechSynthesis.speak(currentUtterance);
}



function resetSpeechButton(messageId) {
  const messageElement = document.getElementById(messageId);
  if (messageElement) {
    const speakBtn = messageElement.querySelector('.speak-btn');
    const playIcon = speakBtn.querySelector('.play-icon');
    const pauseIcon = speakBtn.querySelector('.pause-icon');
    
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    speakBtn.style.color = '';
  }
}

function selectBestVoice(voices) {
  if (!voices || voices.length === 0) return null;
  
  // Priority order for natural-sounding voices
  const voicePreferences = [
    // High-quality neural voices
    /microsoft.*neural/i,
    /google.*wavenet/i,
    /amazon.*neural/i,
    
    // Standard high-quality voices
    /samantha/i,
    /alex/i,
    /karen/i,
    /daniel/i,
    /susan/i,
    /victoria/i,
    
    // Female voices (often more pleasant for medical advice)
    /female/i,
    /woman/i,
    
    // Any English voice
    /en-us/i,
    /en-gb/i,
    /en-au/i,
    /^en/i
  ];
  
  // Try each preference in order
  for (const preference of voicePreferences) {
    const voice = voices.find(v => 
      (v.name && preference.test(v.name)) || 
      (v.lang && preference.test(v.lang))
    );
    if (voice) return voice;
  }
  
  // Fallback to first English voice or default
  return voices.find(v => v.lang && v.lang.startsWith('en')) || voices[0];
}

function cleanTextForSpeech(text) {
  return text
    // Remove markdown formatting
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    
    // Medical text improvements
    .replace(/\b(mg|ml|cm|mm)\b/g, ' $1 ') // Add spaces around units
    .replace(/\b(\d+)([a-zA-Z])/g, '$1 $2') // Space between numbers and letters
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Space in camelCase
    
    // Punctuation for natural pauses
    .replace(/\n\n/g, '. ') // Double newlines become periods
    .replace(/\n/g, ', ') // Single newlines become commas
    .replace(/•/g, '. ') // Bullets become periods
    .replace(/- /g, '. ') // Dashes become periods
    .replace(/:/g, ': ') // Ensure space after colons
    
    // Common medical abbreviations
    .replace(/\bDr\./g, 'Doctor')
    .replace(/\bMD\b/g, 'M D')
    .replace(/\bRN\b/g, 'R N')
    .replace(/\bER\b/g, 'Emergency Room')
    .replace(/\bICU\b/g, 'I C U')
    .replace(/\bECG\b/g, 'E C G')
    .replace(/\bMRI\b/g, 'M R I')
    .replace(/\bCT\b/g, 'C T')
    
    // Clean up extra spaces and punctuation
    .replace(/\s+/g, ' ')
    .replace(/\s*([.,;:!?])\s*/g, '$1 ')
    .replace(/\.{2,}/g, '.')
    .trim();
}

function resetAllSpeechButtons() {
  document.querySelectorAll('.speak-btn').forEach(btn => {
    const playIcon = btn.querySelector('.play-icon');
    const pauseIcon = btn.querySelector('.pause-icon');
    
    if (playIcon && pauseIcon) {
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
      btn.style.color = '';
    }
  });
}

function copyMessage(messageId) {
  const messageElement = document.getElementById(messageId);
  const textElement = messageElement.querySelector('.message-text');
  const text = textElement.textContent;
  
  navigator.clipboard.writeText(text).then(() => {
    const copyBtn = messageElement.querySelector('.copy-btn');
    const originalColor = copyBtn.style.color;
    copyBtn.style.color = 'var(--accent-color)';
    setTimeout(() => {
      copyBtn.style.color = originalColor;
    }, 1000);
  });
}

// Voice input
function initializeSpeechRecognition() {
  if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onresult = function(event) {
      const transcript = event.results[0][0].transcript;
      document.getElementById('health-issue').value = transcript;
      resetMicButton();
    };
    
    recognition.onend = function() {
      resetMicButton();
    };
    
    recognition.onerror = function() {
      resetMicButton();
    };
  } else {
    document.getElementById('mic-button').style.display = 'none';
  }
}

function toggleVoiceInput() {
  const micBtn = document.getElementById('mic-button');
  
  if (micBtn.classList.contains('listening')) {
    recognition.stop();
    resetMicButton();
  } else {
    micBtn.classList.add('listening');
    micBtn.innerHTML = `
      <svg class="mic-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    `;
    recognition.start();
  }
}

function resetMicButton() {
  const micBtn = document.getElementById('mic-button');
  micBtn.classList.remove('listening');
  micBtn.innerHTML = `
    <svg class="mic-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  `;
}

// History management
async function loadUserHistory() {
  if (isGuest || !currentUser) {
    displayHistory([]);
    return;
  }
  
  try {
    const { data: history, error } = await supabase
      .from('health_history')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error loading history:', error);
      displayHistory([]);
      return;
    }
    
    displayHistory(history || []);
  } catch (error) {
    console.error('Error loading user history:', error);
    displayHistory([]);
  }
}

// This function is now replaced by saveToLocalHistory

function displayHistory(history) {
  const historyList = document.getElementById('history-list');
  historyList.innerHTML = '';
  
  if (history.length === 0) {
    historyList.innerHTML = '<div class="empty-history">It\'s empty</div>';
    return;
  }
  
  history.slice(-10).reverse().forEach((item, index) => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
      <div class="history-issue">${item.issue}</div>
      <div class="history-date">${new Date(item.created_at).toLocaleDateString()}</div>
      <button class="delete-history-item" onclick="deleteHistoryItem('${item.id}')" title="Delete this item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3,6 5,6 21,6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
      </button>
    `;
    
    historyItem.addEventListener('click', (e) => {
      if (!e.target.closest('.delete-history-item')) {
        document.getElementById('health-issue').value = item.issue;
        closeHistoryPanel();
      }
    });
    
    historyList.appendChild(historyItem);
  });
}

function toggleHistory() {
  const historyPanel = document.getElementById('history-panel');
  const overlay = document.getElementById('panel-overlay');
  
  historyPanel.classList.toggle('hidden');
  overlay.classList.toggle('active');
  
  if (!historyPanel.classList.contains('hidden')) {
    loadUserHistory();
  }
  
  closeSidePanel();
}

function closeHistoryPanel() {
  const historyPanel = document.getElementById('history-panel');
  const overlay = document.getElementById('panel-overlay');
  
  historyPanel.classList.add('hidden');
  overlay.classList.remove('active');
}

async function deleteHistoryItem(itemId) {
  if (!confirm('Delete this history item?')) return;
  
  try {
    if (isGuest || !currentUser) {
      // For guest users, remove from local storage if implemented
      return;
    }
    
    const { error } = await supabase
      .from('health_history')
      .delete()
      .eq('id', itemId)
      .eq('user_id', currentUser.id);
    
    if (error) {
      console.error('Error deleting history item:', error);
      alert('Failed to delete history item');
      return;
    }
    
    // Reload history
    loadUserHistory();
  } catch (error) {
    console.error('Error deleting history item:', error);
    alert('Failed to delete history item');
  }
}

// Utility functions
function clearChat() {
  if (confirm('Clear all messages?')) {
    document.getElementById('chat-messages').innerHTML = '';
    chatHistory = [];
    lastUserMessageId = null;
    
    // Reset to center layout
    const heroSection = document.querySelector('.hero-section');
    const chatContainer = document.querySelector('.chat-container');
    const mainContent = document.querySelector('.main-content');
    heroSection.classList.remove('hidden');
    chatContainer.classList.remove('has-messages');
    mainContent.classList.remove('has-messages');
    
    // Update greeting
    setTimeBasedGreeting();
    
    // Close dropdown menu
    document.getElementById('dropdown-menu').classList.remove('active');
  }
}

// Side panel functions
function toggleSidePanel() {
  const panel = document.getElementById('side-panel');
  const overlay = document.getElementById('panel-overlay');
  panel.classList.toggle('active');
  overlay.classList.toggle('active');
}

function closeSidePanel() {
  const panel = document.getElementById('side-panel');
  const overlay = document.getElementById('panel-overlay');
  panel.classList.remove('active');
  overlay.classList.remove('active');
}

// Dropdown menu functions
function toggleDropdownMenu() {
  const dropdown = document.getElementById('dropdown-menu');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

// Time-based greeting
function setTimeBasedGreeting() {
  const hour = new Date().getHours();
  const heroTitle = document.getElementById('hero-title');
  
  let greeting;
  if (hour < 12) {
    greeting = 'Good morning!';
  } else if (hour < 17) {
    greeting = 'Good afternoon!';
  } else {
    greeting = 'Good evening!';
  }
  
  heroTitle.textContent = `${greeting} How can I help you today?`;
}

function shareChat() {
  if (chatHistory.length === 0) {
    alert('No messages to share');
    return;
  }
  
  const chatText = chatHistory
    .map(msg => `${msg.sender === 'user' ? 'You' : 'PreAid'}: ${msg.content}`)
    .join('\n\n');
  
  if (navigator.share) {
    navigator.share({
      title: 'PreAid Health Consultation',
      text: chatText
    });
  } else {
    navigator.clipboard.writeText(chatText).then(() => {
      alert('Chat copied to clipboard!');
    });
  }
}

function initializeTheme() {
  const savedTheme = localStorage.getItem('preaid-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('preaid-theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const themeIcon = document.querySelector('.theme-icon');
  if (theme === 'light') {
    themeIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
  } else {
    themeIcon.innerHTML = `<circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
  }
}

function setResponsivePlaceholder() {
  const textarea = document.getElementById('health-issue');
  if (!textarea) return;
  
  const isMobile = window.innerWidth <= 768;
  const fullText = textarea.getAttribute('data-placeholder-full');
  const mobileText = textarea.getAttribute('data-placeholder-mobile');
  
  textarea.placeholder = isMobile ? mobileText : fullText;
}

// Global variables for maps
if (typeof hospitalMap === 'undefined') {
  var hospitalMap = null;
}
if (typeof userLocation === 'undefined') {
  var userLocation = null;
}
if (typeof hospitalMarkers === 'undefined') {
  var hospitalMarkers = [];
}
if (typeof apiTimeout === 'undefined') {
  var apiTimeout = null;
}
if (typeof mapTilerApiKey === 'undefined') {
  var mapTilerApiKey = null;
}

// Get MapTiler API key
function getMapTilerKey() {
  mapTilerApiKey = window.ENV?.MAPTILER_API_KEY || null;
  console.log('MapTiler API Key:', mapTilerApiKey ? 'Found' : 'Missing');
  return mapTilerApiKey;
}

// Hospital Map Functionality
function openHospitalModal() {
  const modal = document.getElementById('hospital-modal');
  const loading = document.getElementById('map-loading');
  const loadingText = document.getElementById('loading-text');
  
  modal.classList.remove('hidden');
  loading.classList.remove('hidden');
  loadingText.textContent = 'Requesting location permission...';
  
  // Get API key and request location
  getMapTilerKey();
  requestLocationAndInitMap();
}

function requestLocationAndInitMap() {
  const loadingText = document.getElementById('loading-text');
  
  if (!navigator.geolocation) {
    loadingText.textContent = 'Geolocation not supported. Using default location...';
    setTimeout(() => initMapWithFallback(), 2000);
    return;
  }
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      loadingText.textContent = 'Loading map and finding hospitals...';
      initMapWithLocation();
    },
    (error) => {
      console.log('Location permission denied:', error);
      loadingText.textContent = 'Location access denied. Using SRM University area...';
      setTimeout(() => initMapWithFallback(), 2000);
    },
    { timeout: 5000, enableHighAccuracy: true }
  );
}

function initMapWithLocation() {
  if (typeof maplibregl === 'undefined') {
    setTimeout(() => initMapWithFallback(), 1000);
    return;
  }
  
  const mapElement = document.getElementById('google-map');
  map = new maplibregl.Map({
    container: mapElement,
    style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${mapTilerApiKey}`,
    center: [userLocation.lng, userLocation.lat],
    zoom: 12
  });
  
  map.on('load', () => {
    // Add user location marker
    new maplibregl.Marker({ color: '#ef4444' })
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(new maplibregl.Popup().setText('Your Location'))
      .addTo(map);
    
    // Start API timeout and search
    startApiTimeout();
    searchNearbyHospitals();
  });
}

function initMapWithFallback() {
  // Try to get user's actual location first
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        if (typeof maplibregl !== 'undefined' && mapTilerApiKey) {
          initMapWithLocation();
        } else {
          showFallbackHospitals();
        }
      },
      (error) => {
        console.log('Location access denied, using SRM area as fallback');
        userLocation = { lat: 12.8230, lng: 80.0444 };
        if (typeof maplibregl !== 'undefined' && mapTilerApiKey) {
          initMapWithLocation();
        } else {
          showFallbackHospitals();
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  } else {
    userLocation = { lat: 12.8230, lng: 80.0444 };
    if (typeof maplibregl !== 'undefined' && mapTilerApiKey) {
      initMapWithLocation();
    } else {
      showFallbackHospitals();
    }
  }
}

function startApiTimeout() {
  apiTimeout = setTimeout(() => {
    console.log('API timeout - showing fallback hospitals');
    showFallbackHospitals();
  }, 8000);
}

async function searchNearbyHospitals() {
  if (!map) return;
  
  try {
    // Use our comprehensive hospital database
    const nearbyHospitals = getHospitalsWithinRadius(userLocation.lat, userLocation.lng, 50);
    
    if (nearbyHospitals.length > 0) {
      clearTimeout(apiTimeout);
      displayRealHospitals(nearbyHospitals);
    } else {
      throw new Error('No hospitals found within 50km');
    }
  } catch (error) {
    console.log('Hospital search failed:', error);
    // Fallback will be triggered by timeout
  }
}

function displayRealHospitals(hospitals) {
  const loading = document.getElementById('map-loading');
  const radarOverlay = document.getElementById('radar-overlay');
  
  // Clear existing markers
  hospitalMarkers.forEach(marker => marker.remove());
  hospitalMarkers = [];
  
  hospitals.forEach((hospital, index) => {
    const coords = [hospital.lng, hospital.lat];
    
    const marker = new maplibregl.Marker({ color: '#10b981' })
      .setLngLat(coords)
      .setPopup(
        new maplibregl.Popup().setHTML(`
          <div style="padding: 10px; min-width: 200px;">
            <h3 style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600;">${hospital.name}</h3>
            <p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">${hospital.distance.toFixed(1)} km away</p>
            <p style="margin: 0 0 5px 0; font-size: 11px; color: #888;">${hospital.type}</p>
            <div style="font-size: 12px; color: #10b981;">⭐ ${hospital.rating}/10</div>
          </div>
        `)
      )
      .addTo(map);
    
    marker.getElement().addEventListener('click', () => {
      selectRealHospital(hospital);
    });
    
    hospitalMarkers.push(marker);
  });
  
  setTimeout(() => {
    loading.classList.add('hidden');
    radarOverlay.classList.add('hidden');
    
    if (hospitals.length > 0) {
      selectRealHospital(hospitals[0]);
    }
  }, 1000);
}

function selectRealHospital(hospital) {
  const detailsPanel = document.getElementById('hospital-details');
  const eta = Math.ceil(hospital.distance * 2) + '-' + Math.ceil(hospital.distance * 3);
  const coords = [hospital.lng, hospital.lat];
  
  map.flyTo({ center: coords, zoom: 15 });
  
  const starsHtml = '⭐'.repeat(Math.floor(hospital.rating)) + 
                   (hospital.rating % 1 >= 0.5 ? '⭐' : '') + 
                   '☆'.repeat(Math.max(0, 5 - Math.ceil(hospital.rating)));
  
  detailsPanel.innerHTML = `
    <div class="hospital-info">
      <div class="hospital-name">${hospital.name}</div>
      
      <div class="hospital-rating-display">
        <div class="rating-stars">${starsHtml}</div>
        <div class="rating-number">${hospital.rating}/10</div>
      </div>
      
      <div class="hospital-meta">
        <div class="meta-item">
          <div class="meta-label">Distance</div>
          <div class="meta-value">${hospital.distance.toFixed(1)} km</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Ambulance ETA</div>
          <div class="meta-value">${eta} mins</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Type</div>
          <div class="meta-value">${hospital.type}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Emergency Services</div>
          <div class="meta-value">${hospital.emergencyServices ? '✅ Available' : '❌ Not Available'}</div>
        </div>
      </div>
      
      <div class="specialties">
        <h4>Specialties</h4>
        <div class="specialty-tags">
          ${hospital.specialties.map(specialty => 
            `<span class="specialty-tag">${specialty}</span>`
          ).join('')}
        </div>
      </div>
      
      <div class="contact-actions">
        <a href="tel:${hospital.contact}" class="contact-btn call-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          Call Hospital
        </a>
        
        <a href="tel:${hospital.ambulanceContact}" class="contact-btn ambulance-call-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 19H5a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1h3m0 3v-3m0 3h3m-3-3V9a1 1 0 0 1 1-1h6l3 4v6a1 1 0 0 1-1 1h-2"/>
            <circle cx="7" cy="19" r="2"/>
            <circle cx="17" cy="19" r="2"/>
          </svg>
          Call Ambulance
        </a>
        
        <button class="contact-btn directions-btn" onclick="openDirections('${hospital.address}', ${hospital.lat}, ${hospital.lng})">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
          Get Directions
        </button>
      </div>
    </div>
  `;
}



function showFallbackHospitals() {
  const loading = document.getElementById('map-loading');
  const loadingText = document.getElementById('loading-text');
  
  loadingText.textContent = 'Loading hospitals...';
  
  setTimeout(() => {
    loading.classList.add('hidden');
    displayHospitalList();
  }, 1000);
}



function closeHospitalModal() {
  const modal = document.getElementById('hospital-modal');
  const loading = document.getElementById('map-loading');
  const hospitalList = document.getElementById('hospital-list');
  const googleMap = document.getElementById('google-map');
  
  modal.classList.add('hidden');
  loading.classList.remove('hidden');
  hospitalList.classList.add('hidden');
  googleMap.style.display = 'block';
  
  if (apiTimeout) {
    clearTimeout(apiTimeout);
    apiTimeout = null;
  }
  
  if (hospitalMarkers.length > 0) {
    hospitalMarkers.forEach(marker => marker.remove());
    hospitalMarkers = [];
  }
  
  document.querySelectorAll('.hospital-item').forEach(item => {
    item.classList.remove('selected');
  });
  
  const detailsPanel = document.getElementById('hospital-details');
  detailsPanel.innerHTML = `
    <div class="details-placeholder">
      <p>🏥 Select a hospital to view details</p>
    </div>
  `;
  
  if (map) {
    map.remove();
    map = null;
  }
  userLocation = null;
}

function displayHospitalList() {
  const hospitalList = document.getElementById('hospital-list');
  const hospitalItems = document.getElementById('hospital-items');
  const googleMap = document.getElementById('google-map');
  
  // Hide map and show list
  googleMap.style.display = 'none';
  hospitalList.classList.remove('hidden');
  
  // Use actual user location or fallback
  const currentLocation = userLocation || { lat: 12.8230, lng: 80.0444 };
  const nearbyHospitals = getHospitalsWithinRadius(currentLocation.lat, currentLocation.lng, 50);
  
  hospitalItems.innerHTML = '';
  
  nearbyHospitals.slice(0, 8).forEach((hospital, index) => {
    const hospitalItem = document.createElement('div');
    hospitalItem.className = 'hospital-item';
    hospitalItem.dataset.hospitalId = hospital.id;
    
    hospitalItem.innerHTML = `
      <div class="hospital-item-content">
        <div class="hospital-name">${hospital.name}</div>
        <div class="hospital-info">
          <span class="hospital-distance">${hospital.distance.toFixed(1)} km</span>
          <span class="hospital-rating">⭐ ${hospital.rating}/10</span>
        </div>
        <div class="hospital-type">${hospital.type}</div>
      </div>
    `;
    
    hospitalItem.addEventListener('click', () => selectHospital(hospital));
    hospitalItems.appendChild(hospitalItem);
  });
  
  // Auto-select first hospital
  if (nearbyHospitals.length > 0) {
    selectHospital(nearbyHospitals[0]);
  }
}

function selectHospital(hospital) {
  document.querySelectorAll('.hospital-item').forEach(item => {
    item.classList.remove('selected');
  });
  
  const currentItem = document.querySelector(`[data-hospital-id="${hospital.id}"]`);
  if (currentItem) {
    currentItem.classList.add('selected');
  }
  
  displayHospitalDetails(hospital);
}

function displayHospitalDetails(hospital) {
  const detailsPanel = document.getElementById('hospital-details');
  const eta = Math.ceil(hospital.distance * 2) + '-' + Math.ceil(hospital.distance * 3);
  
  detailsPanel.innerHTML = `
    <div class="hospital-info">
      <h3 class="hospital-name">${hospital.name}</h3>
      
      <div class="info-item">
        <div class="info-label">Rating</div>
        <div class="info-value">⭐ ${hospital.rating}/10</div>
      </div>
      
      <div class="info-item">
        <div class="info-label">Distance</div>
        <div class="info-value">${hospital.distance.toFixed(1)} km</div>
      </div>
      
      <div class="info-item">
        <div class="info-label">Ambulance ETA</div>
        <div class="info-value">${eta} mins</div>
      </div>
      
      <div class="info-item">
        <div class="info-label">Type</div>
        <div class="info-value">${hospital.type}</div>
      </div>
      
      <div class="info-item">
        <div class="info-label">Emergency Services</div>
        <div class="info-value ${hospital.emergencyServices ? 'available' : 'unavailable'}">
          ${hospital.emergencyServices ? '✅ Available' : '❌ Not Available'}
        </div>
      </div>
      
      <div class="info-item">
        <div class="info-label">Contact</div>
        <div class="info-value">${hospital.contact}</div>
      </div>
      
      <div class="action-buttons">
        <a href="tel:${hospital.contact}" class="action-btn call-btn">
          📞 Call Hospital
        </a>
        
        <a href="tel:${hospital.ambulanceContact}" class="action-btn ambulance-btn">
          🚑 Call Ambulance
        </a>
        
        <button class="action-btn directions-btn" onclick="openDirections('${hospital.address}', ${hospital.lat}, ${hospital.lng})">
          🗺️ Get Directions
        </button>
      </div>
    </div>
  `;
}

function openDirections(address, hospitalLat, hospitalLng) {
  if (userLocation && hospitalLat && hospitalLng) {
    // Use coordinates for more accurate routing
    const mapsUrl = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${hospitalLat},${hospitalLng}`;
    window.open(mapsUrl, '_blank');
  } else {
    // Fallback to address-based routing
    const encodedAddress = encodeURIComponent(address);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    window.open(mapsUrl, '_blank');
  }
}

// Enhanced safety warning system
function checkForHighRiskProcedures(query) {
  // This function works as a backup to the keyword system
  // It uses AI-like analysis to detect potentially dangerous procedures
  const dangerousPatterns = [
    /perform\s+(cpr|chest\s+compressions)/i,
    /give\s+(medication|medicine|pills)/i,
    /move\s+(unconscious|injured)\s+person/i,
    /treat\s+(fracture|broken\s+bone)/i,
    /stop\s+(severe|heavy)\s+bleeding/i,
    /help\s+(choking|not\s+breathing)/i,
    /do\s+(surgery|operation)/i,
    /inject\s+(insulin|medication)/i
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(query));
}

// Function to check for high-risk keywords
function containsHighRiskKeywords(query) {
  const highRiskKeywords = ['cpr', 'choking', 'heimlich', 'unconscious', 'not breathing', 'chest compressions', 'fracture', 'broken bone', 'spinal', 'neck injury', 'severe bleeding', 'deep cut', 'medication', 'pills', 'injection', 'surgery', 'operation', 'trauma', 'accident', 'heart attack', 'stroke', 'seizure', 'overdose', 'poisoning', 'burn', 'electric shock'];
  return highRiskKeywords.some(keyword => query.toLowerCase().includes(keyword));
}

// Function to enhance Gemini prompts with safety context
function addSafetyContextToPrompt(originalPrompt, userQuery) {
  const needsSafetyWarning = containsHighRiskKeywords(userQuery) || checkForHighRiskProcedures(userQuery);
  
  if (needsSafetyWarning) {
    return originalPrompt + `

IMPORTANT SAFETY NOTE: This query involves potentially dangerous medical procedures. Please analyze if the user is asking about procedures that could cause harm if performed incorrectly by untrained individuals. If so, prioritize safety warnings and emphasize the need for professional medical help. Include emergency numbers for India (108, 102, 100, 101) and stress that professional training is required for procedures like CPR, treating fractures, or handling unconscious patients.`;
  }
  
  return originalPrompt;
}