# 🎨 User Style Learner System

## Overview

The **User Style Learner** is an AI-powered system that learns your writing style from past emails and replies, then uses that style to generate replies that sound exactly like you.

---

## How It Works

### 1. **Learning Phase**
- Analyzes your last 50-100 emails and replies
- Extracts writing style characteristics:
  - Greeting style ("Hey", "Hi", "Hello", "Dear")
  - Closing style ("Thanks", "Regards", "- Name")
  - Formality level (formal, informal, casual, professional)
  - Sentence length (short, medium, long)
  - Emoji usage (frequent, occasional, rare, never)
  - Punctuation style
  - Common vocabulary/phrases
  - Tone and language style

### 2. **Style Profile**
Creates a JSON profile like:
```json
{
  "greeting": "Hey",
  "closing": "Thanks, -Anurag",
  "formality": "informal",
  "sentenceLength": "medium",
  "emojiUsage": "rare",
  "punctuationStyle": "balanced",
  "vocabulary": ["cool", "let me know", "no worries"],
  "tone": "friendly and concise",
  "messageLength": "medium",
  "languageStyle": "direct"
}
```

### 3. **Reply Generation**
- Uses your style profile when generating replies
- Matches your exact greeting, tone, vocabulary, and closing
- Replies sound like you wrote them!

### 4. **Auto-Improvement**
- When you edit and send an AI-generated draft, it's saved as a training example
- Next retrain incorporates your edits
- Style profile gets better over time

---

## API Endpoints

### Retrain Style Profile
**POST** `/api/user/style/retrain`

Retrains your style profile by analyzing your past emails.

**Response:**
```json
{
  "success": true,
  "message": "Style profile retrained successfully",
  "styleProfile": {
    "greeting": "Hey",
    "closing": "Thanks",
    "formality": "informal",
    ...
  },
  "stats": {
    "sampleCount": 45,
    "learnedAt": "2025-01-13T10:30:00Z"
  }
}
```

### Get Current Style Profile
**GET** `/api/user/style/retrain`

Returns your current style profile.

**Response:**
```json
{
  "success": true,
  "styleProfile": {
    "greeting": "Hey",
    "closing": "Thanks",
    ...
  },
  "stats": {
    "sampleCount": 45,
    "learnedAt": "2025-01-13T10:30:00Z"
  }
}
```

---

## Usage

### Automatic Learning
1. **Send emails** - Your sent emails are automatically saved for learning
2. **Edit AI drafts** - When you edit and send an AI-generated reply, it's saved as a training example
3. **Style improves** - The more you use it, the better it gets

### Manual Retraining
1. Call `POST /api/user/style/retrain` to retrain your profile
2. System analyzes your latest emails
3. Updates your style profile
4. Future replies will use the updated style

### In Code
```javascript
import { learnUserStyle, getUserStyleProfile } from '@/ai/user_style_learner'

// Retrain style profile
const profile = await learnUserStyle(userId)

// Get current profile
const currentProfile = await getUserStyleProfile(userId)
```

---

## Integration Points

### 1. Reply Generator
- `ai/reply_generator.js` automatically uses your style profile
- No changes needed - it just works!

### 2. Email Send
- `app/api/emails/send/route.js` saves your sent emails
- Automatically marked as training examples

### 3. Memory System
- Style profile stored in deep memory
- Key: `user_style_profile`
- High priority for fast retrieval

---

## Style Profile Structure

```typescript
{
  greeting: string          // "Hey", "Hi", "Hello", "Dear"
  closing: string           // "Thanks", "Regards", "- Name"
  formality: string         // "formal" | "informal" | "casual" | "professional"
  sentenceLength: string    // "short" | "medium" | "long"
  emojiUsage: string       // "frequent" | "occasional" | "rare" | "never"
  punctuationStyle: string // "minimal" | "balanced" | "heavy"
  vocabulary: string[]      // Array of preferred phrases
  tone: string             // Description of tone
  messageLength: string    // "short" | "medium" | "long"
  languageStyle: string    // "direct" | "soft" | "diplomatic" | "assertive"
  stats: {
    sampleCount: number    // Number of emails analyzed
    learnedAt: string      // ISO timestamp
  }
}
```

---

## How Replies Are Generated

1. **Load Style Profile**
   - Retrieves your style profile from memory
   - Falls back to default if not found

2. **Build Style Instructions**
   - Converts profile into LLM instructions
   - Includes greeting, closing, tone, vocabulary

3. **Generate Reply**
   - LLM generates reply matching your style
   - Uses your preferred greeting and closing
   - Matches tone, formality, and vocabulary

4. **Result**
   - Reply sounds like you wrote it!

---

## Training Data Sources

The system learns from:

1. **AI-Generated Replies You Sent**
   - Emails with `aiReply` field in database
   - These were likely edited and sent by you

2. **User Replies in Memory**
   - Saved when you send emails via `/api/emails/send`
   - Marked as `isTrainingExample: true`

3. **Sent Emails**
   - Any emails you've sent through the system
   - Stored in deep memory

---

## Best Practices

### 1. Send More Emails
- The more emails you send, the better the profile
- System learns from your actual writing

### 2. Edit AI Drafts
- When you edit an AI-generated draft, it's saved
- Your edits teach the system your preferences

### 3. Retrain Periodically
- Retrain after sending many emails
- Profile updates with your latest style

### 4. Review Your Profile
- Check your profile with `GET /api/user/style/retrain`
- Verify it matches your style

---

## Troubleshooting

### Profile Not Learning?
- **Check email count**: Need at least 10-20 emails for good learning
- **Retrain manually**: Call `POST /api/user/style/retrain`
- **Check memory**: Verify emails are being saved

### Replies Don't Match Style?
- **Retrain profile**: Your style may have changed
- **Check profile**: Review current profile with GET endpoint
- **Send more emails**: More data = better profile

### Default Style Used?
- **No profile found**: System uses default professional style
- **Retrain**: Create your first profile by retraining
- **Wait for data**: Need some emails first

---

## Technical Details

### Files Created
- `ai/user_style_learner.js` - Core learning logic
- `app/api/user/style/retrain/route.js` - API endpoint

### Files Modified
- `ai/reply_generator.js` - Uses style profile
- `app/api/emails/send/route.js` - Saves user replies

### Dependencies
- OpenAI API (for style analysis)
- Deep Memory System (for storage)
- Prisma (for email fetching)

---

## Example Flow

1. **User sends 20 emails** → Saved to memory
2. **User calls retrain** → System analyzes emails
3. **Style profile created** → Saved to deep memory
4. **User receives email** → Reply generator loads profile
5. **AI generates reply** → Matches user's style exactly
6. **User edits and sends** → Saved as training example
7. **User retrains later** → Profile improves with edits

---

## Future Enhancements

- **Auto-retrain**: Automatically retrain after N new emails
- **Style variations**: Learn different styles for different contexts
- **Style templates**: Pre-built style profiles
- **Style analytics**: Show style evolution over time
- **Multi-language**: Support for different languages

---

## Summary

✅ **Learns your writing style** from past emails  
✅ **Generates replies** that sound like you  
✅ **Auto-improves** when you edit drafts  
✅ **Easy to retrain** via API endpoint  
✅ **Fully integrated** with reply generator  

**Your AI COO now writes like you!** 🎨


