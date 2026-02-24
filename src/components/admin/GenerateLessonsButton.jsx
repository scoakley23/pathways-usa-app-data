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
          const lessonPrompt = `Create a comprehensive civics lesson about "${subtopic}" for U.S. citizenship test preparation.
          
Include:
1. A clear, engaging title
2. A 2-sentence description
3. Main lesson content (300-400 words) explaining the concept clearly for ESL learners
4. 3-5 key bullet points summarizing the main ideas
5. A short real-life dialogue (4-6 exchanges) showing how this topic applies in everyday American life

Format as JSON with these keys: title, description, content, key_points (array), dialogue (string)`;

          const lessonData = await base44.integrations.Core.InvokeLLM({
            prompt: lessonPrompt,
            response_json_schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                content: { type: "string" },
                key_points: { type: "array", items: { type: "string" } },
                dialogue: { type: "string" }
              }
            }
          });

          // Create lesson
          const lesson = await base44.entities.Lesson.create({
            topic: topic.name,
            title: lessonData.title,
            description: lessonData.description,
            content: lessonData.content + "\n\n## Real-Life Scenario\n" + lessonData.dialogue,
            key_points: lessonData.key_points,
            order: i + 1,
            video_url: null
          });

          // Generate flashcards
          const flashcardsPrompt = `Create 5 flashcards for the lesson "${lessonData.title}".
Each flashcard should have a term and definition suitable for citizenship test preparation.

Return as JSON array with objects containing: term, definition, example (optional)`;

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
          const quizPrompt = `Create 4 multiple-choice quiz questions about "${lessonData.title}".
Each question should test understanding of the key concepts.

Return as JSON array with objects containing: question, options (array of 4 strings), correct_answer, explanation`;

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