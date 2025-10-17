# PreAid - Personal Health Companion

An AI-powered health assistant that provides instant medical guidance and emergency support.

## 🚀 Features

- 🤖 AI-powered health advice using multiple AI providers (Gemini, OpenAI, Cohere)
- 🎤 Voice input support
- 🔊 Text-to-speech responses
- 📱 Responsive design
- 🏥 Hospital finder with real Tamil Nadu hospital database
- 📊 Health history tracking
- 🔐 User authentication (Google, Email, Guest mode)
- 🗺️ Interactive maps with nearby hospitals
- 🚑 Emergency services integration

## 🛠️ Setup Instructions

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd PreAid
```

### 2. Configure Environment Variables

**For Local Development:**
1. Copy `env-config.js.example` to `env-config.js`
2. Add your actual API keys to `env-config.js`

**Required API Keys:**
- `GEMINI_API_KEY`: Google Gemini AI API key
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `MAPTILER_API_KEY`: MapTiler API key for maps
- `OPENAI_API_KEY`: OpenAI API key (optional)
- `COHERE_API_KEY`: Cohere API key (optional)

### 3. For Production Deployment

**Netlify:**
- Add environment variables in Netlify Dashboard → Site Settings → Environment Variables

**Vercel:**
- Add environment variables in Vercel Dashboard → Project Settings → Environment Variables

**Other platforms:**
- Set environment variables according to your platform's documentation

### 4. Local Development Server

**Option 1: Using Node.js serve**
```bash
npm install -g serve
serve -s . -l 3000
```

**Option 2: Using Python**
```bash
python -m http.server 3000
```

**Option 3: Using any local server**
- Open `index.html` in a web browser
- Or use VS Code Live Server extension

## 🏥 Hospital Database

The app includes a comprehensive database of Tamil Nadu hospitals with:
- 20+ major hospitals across Tamil Nadu
- Real GPS coordinates
- Emergency ambulance services
- Contact information
- Specialties and ratings

## 🔒 Security

- API keys are excluded from version control
- Use environment variables for production deployment
- Follow the example configuration files
- Never commit actual API keys to the repository

## 📱 Usage

1. **Authentication**: Choose Google login, email signup, or guest mode
2. **Health Chat**: Describe your symptoms and get AI-powered advice
3. **Emergency**: Use the ambulance button to find nearby hospitals
4. **Voice Input**: Click the microphone for voice-to-text input
5. **History**: View your previous health consultations (logged-in users)

## 🚨 Disclaimer

This application provides general health information and should not replace professional medical advice. Always consult qualified healthcare professionals for proper medical diagnosis and treatment.

## 📄 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Emergency Numbers (India)

- **Emergency**: 108
- **Ambulance**: 102
- **Police**: 100
- **Fire**: 101