import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from "sonner";

export default function GenerateLessonsButton() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateLessons = async () => {
    setIsGenerating(true);
    
    try {
      // Fetch all civics questions to understand topics
      const questions = await base44.entities.CivicsQuestion.list({ limit: 500 });
      
      // Define main topics based on civics test structure
      const topics = [
        { 
          name: "Principles of American Democracy",
          subtopics: ["Popular sovereignty", "Limited government", "Separation of powers", "Checks and balances", "Federalism"]
        },
        { 
          name: "System of Government",
          subtopics: ["Branches of government", "Congress", "President", "Courts", "State and local government"]
        },
        { 
          name: "Rights and Responsibilities",
          subtopics: ["Bill of Rights", "Freedom of speech", "Voting rights", "Civic responsibilities", "Amendments"]
        },
        { 
          name: "U.S. History",
          subtopics: ["Colonial period", "Revolutionary War", "Civil War", "20th Century events", "Important figures"]
        },
        { 
          name: "Geography and Symbols",
          subtopics: ["States and capitals", "Territories", "National symbols", "Landmarks", "Flag and anthem"]
        }
      ];

      let lessonCount = 0;
      
      for (const topic of topics) {
        // Get relevant questions for this topic
        const topicQuestions = questions.filter(q => 
          q.category?.includes(topic.name.split(' ')[0]) || 
          q.question?.toLowerCase().includes(topic.name.toLowerCase().split(' ')[0])
        ).slice(0, 15);

        // Generate 4-5 lessons per topic
        for (let i = 0; i < Math.min(5, topic.subtopics.length); i++) {
          const subtopic = topic.subtopics[i];
          
          // Generate lesson content with AI
          const lessonPrompt = `Create a comprehensive, beginner-friendly civics lesson about "${subtopic}" for U.S. citizenship test preparation.

REQUIREMENTS:
1. Clear, engaging title (simple language)
2. 2-sentence description suitable for ESL learners
3. Main content (400-500 words) in simple English with:
   - Use short sentences and basic vocabulary
   - Include 2-3 relevant markdown image URLs from Unsplash (use proper markdown: ![alt text](https://images.unsplash.com/photo-xxx))
   - Add a real-life dialogue showing this concept in everyday American life
   - Break content into clear sections with ## headings
   - Include concrete examples
4. 4-6 key bullet points summarizing main ideas
5. Suggest 1 relevant YouTube search term for finding educational videos

Use this format for images: Search for relevant Unsplash photos and use: ![Description](https://images.unsplash.com/photo-[id]?w=800)
Example topics for images: American flag, Capitol building, voting, Constitution, etc.

Format as JSON with keys: title, description, content (markdown with images), key_points (array), youtube_search`;

          const lessonData = await base44.integrations.Core.InvokeLLM({
            prompt: lessonPrompt,
            response_json_schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                content: { type: "string" },
                key_points: { type: "array", items: { type: "string" } },
                youtube_search: { type: "string" }
              }
            }
          });

          // Search for relevant YouTube video
          let videoUrl = null;
          try {
            const searchResults = await base44.integrations.Core.InvokeLLM({
              prompt: `Find a YouTube video URL for: "${lessonData.youtube_search}" related to U.S. citizenship education. Return just the full URL.`,
              add_context_from_internet: true
            });
            if (searchResults && searchResults.includes('youtube.com')) {
              videoUrl = searchResults.trim();
            }
          } catch (error) {
            console.log('Could not find video for', lessonData.youtube_search);
          }

          // Create lesson
          const lesson = await base44.entities.Lesson.create({
            topic: topic.name,
            title: lessonData.title,
            description: lessonData.description,
            content: lessonData.content,
            key_points: lessonData.key_points,
            order: i + 1,
            video_url: videoUrl
          });

          // Generate flashcards  
          const flashcardsPrompt = `Create 6-8 flashcards for the lesson "${lessonData.title}" about ${subtopic}.
Use simple language suitable for ESL learners.
Each flashcard should have:
- term: A key vocabulary word or concept (2-4 words)
- definition: Clear, simple explanation (1-2 sentences, basic English)
- example: A concrete example showing how it's used in real life

Return as JSON with a flashcards array.`;

          const flashcardsData = await base44.integrations.Core.InvokeLLM({
            prompt: flashcardsPrompt,
            response_json_schema: {
              type: "object",
              properties: {
                flashcards: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      term: { type: "string" },
                      definition: { type: "string" },
                      example: { type: "string" }
                    }
                  }
                }
              }
            }
          });

          for (const card of flashcardsData.flashcards) {
            await base44.entities.LessonFlashcard.create({
              lesson_id: lesson.id,
              term: card.term,
              definition: card.definition,
              example: card.example || null
            });
          }

          // Generate quiz questions
          const quizPrompt = `Create 5-6 multiple-choice quiz questions about "${lessonData.title}" for U.S. citizenship test prep.

REQUIREMENTS for each question:
- Use simple, clear language (ESL-friendly)
- Test real understanding, not just memorization
- Include practical application questions
- 4 answer options each
- Clear explanation for why the answer is correct

Return as JSON with a questions array.`;

          const quizData = await base44.integrations.Core.InvokeLLM({
            prompt: quizPrompt,
            response_json_schema: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      options: { type: "array", items: { type: "string" } },
                      correct_answer: { type: "string" },
                      explanation: { type: "string" }
                    }
                  }
                }
              }
            }
          });

          for (const q of quizData.questions) {
            await base44.entities.LessonQuiz.create({
              lesson_id: lesson.id,
              question: q.question,
              options: q.options,
              correct_answer: q.correct_answer,
              explanation: q.explanation
            });
          }

          lessonCount++;
          toast.success(`Created lesson ${lessonCount}: ${lessonData.title}`);
        }
      }

      toast.success(`Successfully generated ${lessonCount} lessons with quizzes and flashcards!`);
      
      // Reload page to show new lessons
      setTimeout(() => window.location.reload(), 2000);
      
    } catch (error) {
      console.error('Failed to generate lessons:', error);
      toast.error('Failed to generate lessons. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      onClick={generateLessons} 
      disabled={isGenerating}
      className="bg-green-600 hover:bg-green-700"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating Lessons...
        </>
      ) : (
        <>
          <BookOpen className="w-4 h-4 mr-2" />
          Generate AI Lessons
        </>
      )}
    </Button>
  );
}