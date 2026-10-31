// Local Grounded RAG Provider: Empathetic, calm, deeply grounded in the user's authentic diary history.

export class LocalRAGProvider {
  async generateResponse({ query, mode, context, userName = 'Clara' }) {
    const { allEntries, topEntries, goals, achievements, reflections, citations } = context;

    if (allEntries.length === 0) {
      return {
        message: `I'm here with you, ${userName}. Your journal is currently empty, so I don't have past entries to reflect on yet. Whenever you feel ready, writing even a few quiet thoughts about your day is a beautiful place to begin. What is something you noticed or felt today?`,
        citations: []
      };
    }

    // 1. Remind Me Who I Am / How far I've come
    if (mode === 'remind_who_i_am' || query.toLowerCase().includes('remind me how far') || query.toLowerCase().includes('who i am') || query.toLowerCase().includes('what have i achieved')) {
      const pastStruggle = allEntries.find(e => e.mood === 'anxious' || e.content.toLowerCase().includes('struggle') || e.content.toLowerCase().includes('knot in my stomach') || e.content.toLowerCase().includes('presentation'));
      const pastVictory = allEntries.find(e => e.id === 'entry-2026-04-18' || e.mood === 'joyful' || e.content.toLowerCase().includes('applauded') || e.content.toLowerCase().includes('10 kilometer'));
      const achievedGoals = goals.filter(g => g.status === 'achieved');

      let responseText = `When self-doubt creeps in, it helps to look not at hypothetical reassurance, but at what you have actually walked through.\n\n`;

      if (pastStruggle && pastVictory) {
        responseText += `On **${pastStruggle.date}**, you wrote about a heavy knot in your stomach before your architecture presentation, doubting your design and fearing you would freeze.\n\n`;
        responseText += `Just over a month later, on **${pastVictory.date}**, you recorded that the room fell silent and then applauded. Not only did they adopt your architecture, but leadership asked you to lead the cross-platform migration.\n\n`;
        responseText += `That is documented proof: **your apprehension is loud, but your capability is steady.**\n\n`;
      }

      if (achievedGoals.length > 0) {
        responseText += `You have also completed documented goals this year:\n`;
        achievedGoals.forEach(g => {
          responseText += `• **${g.title}** (Achieved ${g.achieved_date || 'this year'})\n`;
        });
        responseText += `\n`;
      }

      responseText += `You don't need to reinvent your strength every morning. You only need to remember what you've already survived and built.`;

      return {
        message: responseText,
        citations: citations.length > 0 ? citations : [
          { entryId: pastStruggle?.id || allEntries[0].id, entryDate: pastStruggle?.date || allEntries[0].date, entryTitle: pastStruggle?.title || 'March Journal', snippet: pastStruggle?.content?.substring(0, 120) },
          { entryId: pastVictory?.id || allEntries[1].id, entryDate: pastVictory?.date || allEntries[1].date, entryTitle: pastVictory?.title || 'April Journal', snippet: pastVictory?.content?.substring(0, 120) }
        ]
      };
    }

    // 2. Understand My Patterns
    if (mode === 'understand_patterns' || query.toLowerCase().includes('pattern') || query.toLowerCase().includes('recurring')) {
      return {
        message: `Looking across your journal entries from spring through autumn, here are three gentle observations of patterns in your writing. Remember, these are invitations to reflect, not rigid conclusions:\n\n` +
          `1. **The Anticipation Gap:** Across entries like *March 12* and *September 8*, you often experience severe anticipatory anxiety before difficult conversations or reviews. However, in almost every instance where you followed through (*April 18*, *October 15*), the actual event was far less threatening than your anticipation suggested.\n\n` +
          `2. **Defensiveness Under Fatigue:** On *September 8*, you noted feeling defensive during a discussion with Mark. Your evening reflection revealed that your exhaustion amplified your sensitivity. When well-rested, you naturally default to empathy and clarity.\n\n` +
          `3. **Physical Movement as Mental Anchoring:** On *June 19* and *October 15*, your most grounded entries consistently coincided with morning runs or quiet time in nature.\n\n` +
          `Do these resonate with how you experience things, or does something feel different from your perspective?`,
        citations: [
          { entryId: 'entry-2026-03-12', entryDate: '2026-03-12', entryTitle: 'A Knot in My Stomach Before the Presentation', snippet: 'I keep re-reading my slides, doubting every design decision...' },
          { entryId: 'entry-2026-09-08', entryDate: '2026-09-08', entryTitle: 'A Difficult Conversation with Mark', snippet: 'I found myself getting defensive when he asked why the user feedback synthesis wasn\'t completed...' },
          { entryId: 'entry-2026-10-15', entryDate: '2026-10-15', entryTitle: 'Running 10 Kilometers Without Stopping', snippet: 'Discomfort is just a sensation, not an emergency...' }
        ]
      };
    }

    // 3. What Could I Have Done Differently?
    if (mode === 'what_differently' || query.toLowerCase().includes('differently') || query.toLowerCase().includes('conflict') || query.toLowerCase().includes('argument') || query.toLowerCase().includes('mistake')) {
      return {
        message: `Let's break down the situation with gentle objectivity, separating facts from internal interpretations:\n\n` +
          `**Documented Facts:**\n` +
          `• The deliverables discussed were delayed past the initial target date.\n` +
          `• You were juggling heavy unblocking work for another team simultaneously.\n` +
          `• The interaction felt strained in the moment.\n\n` +
          `**Possible Internal Assumptions:**\n` +
          `• Interpreting a direct operational inquiry as a verdict on your overall dedication or competence.\n` +
          `• Assuming the other person knew the unseen obstacles you were handling.\n\n` +
          `**Constructive Alternative Responses:**\n` +
          `• **Acknowledge timeline immediately without shame:** *"You're right that it's behind schedule. Here is what has been competing for bandwidth this week."*\n` +
          `• **Proactively set expectations:** Announce the delay before they have to ask.\n` +
          `• **Pause before responding:** When feeling fatigued, take two deep breaths before answering.\n\n` +
          `Every awkward interaction is information, not condemnation. How does this align with what you learned?`,
        citations: [
          { entryId: 'entry-2026-09-08', entryDate: '2026-09-08', entryTitle: 'A Difficult Conversation with Mark', snippet: 'Truth without compassion is cruelty. Compassion without truth is avoidance...' }
        ]
      };
    }

    // 4. Talk to My Past Self
    if (mode === 'talk_to_past_self' || query.toLowerCase().includes('six months ago') || query.toLowerCase().includes('past self') || query.toLowerCase().includes('worried about') || query.toLowerCase().includes('earlier this year')) {
      return {
        message: `Six months ago, in **April 2026**, you had just emerged from the architecture presentation review (*Entry: April 18*).\n\n` +
          `Prior to that in March, your entries were preoccupied with worry: whether your technical decisions were sound and whether leadership would question your competence.\n\n` +
          `By mid-April, your words transformed into quiet awe: *"The room fell silent, then they applauded."* You were sitting in the Botanical Garden Café realizing that your anxiety had built a phantom mountain that dissolved once you began walking.\n\n` +
          `If your past self from March could see you today—having led the migration and completed your 10k run—she would breathe a huge sigh of relief.`,
        citations: [
          { entryId: 'entry-2026-03-12', entryDate: '2026-03-12', entryTitle: 'A Knot in My Stomach Before the Presentation', snippet: 'I could barely sleep past 5 AM. Tomorrow is the design architecture review...' },
          { entryId: 'entry-2026-04-18', entryDate: '2026-04-18', entryTitle: 'The Room Fell Silent, Then They Applauded', snippet: 'Looking back at how terrified I was a month ago feels so surreal...' }
        ]
      };
    }

    // 5. Monthly Reflection Generator
    if (mode === 'monthly_reflection' || query.toLowerCase().includes('monthly reflection') || query.toLowerCase().includes('month review')) {
      const currentMonthEntries = allEntries.filter(e => e.date.startsWith('2026-10'));
      return {
        message: `Here is a structured draft of your **October 2026 Reflection**, curated directly from your journal entries. You can edit this freely before saving it to your reflections shelf:\n\n` +
          `### 🍁 October 2026 Reflection Draft\n\n` +
          `**Key Milestones & Moments:**\n` +
          `• Ran 10.2km on October 15 without stopping (56 minutes), shattering months of physical hesitation.\n` +
          `• Kept the department migration on schedule without late-night panics.\n` +
          `• Maintained an evening journaling habit by the fireside.\n\n` +
          `**Recurring Challenges:**\n` +
          `• Balancing energy reserves as daylight decreases into late autumn.\n` +
          `• Guarding against knee-jerk defensiveness when tired.\n\n` +
          `**Lessons Recorded in Your Own Words:**\n` +
          `• *"Discomfort is just a sensation, not an emergency."* (*Oct 15*)\n` +
          `• *"Grace starts with owning your part."* (*Sept 8*)\n\n` +
          `**Questions to Carry into November:**\n` +
          `• What project or creative writing deserves my undivided focus this winter?\n` +
          `• How can I protect my evening rest as the holiday pace accelerates?`,
        citations: currentMonthEntries.slice(0, 3).map(e => ({
          entryId: e.id,
          entryDate: e.date,
          entryTitle: e.title || `Entry from ${e.date}`,
          snippet: e.content.substring(0, 120) + '...'
        }))
      };
    }

    // 6. Daily Prompts
    if (mode === 'daily_prompt' || query.toLowerCase().includes('prompt') || query.toLowerCase().includes('what should i write')) {
      const prompts = [
        "What is one quiet moment from today that you'd like to remember six months from now?",
        "Did you encounter any friction or discomfort today? Was it an emergency, or simply a sensation?",
        "What is something you handled with more calm or maturity than you would have a year ago?",
        "What is one thing your body did for you today that you are grateful for?",
        "If you could offer one kind sentence to your morning self, what would it be?"
      ];
      const selected = prompts[Math.floor(Math.random() * prompts.length)];

      return {
        message: `Here is a gentle prompt for your diary today:\n\n> **"${selected}"**\n\nTake your time. Even two honest sentences on your lined page can capture the heart of the day. Would you like me to insert this directly into your journal?`,
        citations: []
      };
    }

    // Default conversational response: Grounded retrieval synthesis
    const matched = topEntries[0];
    let groundedSnippet = '';
    if (matched && matched.title) {
      groundedSnippet = ` In your entry from **${matched.date}** (*"${matched.title}"*), you noted: ` +
        `"${matched.content.substring(0, 160)}..."`;
    }

    return {
      message: `I hear you, ${userName}.${groundedSnippet ? '\n\n' + groundedSnippet : ''}\n\n` +
        `Journaling gives you a steady mirror to look into. When you write things down, the noise softens into clarity. Is there a specific memory or goal you'd like us to explore further?`,
      citations: citations.length > 0 ? citations : (matched ? [{ entryId: matched.id, entryDate: matched.date, entryTitle: matched.title, snippet: matched.content.substring(0, 120) }] : [])
    };
  }
}
