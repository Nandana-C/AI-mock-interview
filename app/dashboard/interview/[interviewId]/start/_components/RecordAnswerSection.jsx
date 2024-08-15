"use client"
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import Webcam from 'react-webcam'
import useSpeechToText from 'react-hook-speech-to-text';
import { Mic } from 'lucide-react'
import { toast } from 'sonner'
import { chatSession } from '@/utils/GeminiAIModel'
import { UserAnswer } from '@/utils/schema'
import { useUser } from '@clerk/nextjs'
import moment from 'moment'
import { db } from '@/utils/db'
import { v4 as uuidv4 } from 'uuid';


function RecordAnswerSection({mockInterviewQuestion,activeQuestionIndex,interviewData}) {
    const [userAnswer, setUserAnswer] = useState('');
    const {user} = useUser();
    const [loading, setLoading] = useState(false);

    const {
        error,
        startSpeechToText,
        stopSpeechToText,
        isRecording,
        results,
        setResults
    } = useSpeechToText({
        continuous: true,
        useLegacyResults: false
    });

    useEffect(() => {
        console.log("Speech-to-text results:", results);
        results.map((result) => (
            setUserAnswer(prevAns => prevAns + result?.transcript)
        ))
    }, [results]);

    useEffect(() => {
        console.log("User Answer:", userAnswer);
        if (!isRecording && userAnswer.length > 10) {
            UpdateUserAnswer();
        }
    }, [userAnswer])

    const StartStopRecording = async () => {
        if (isRecording) {
            stopSpeechToText();
        } else {
            startSpeechToText();
        }
    }

    const UpdateUserAnswer = async () => {
        console.log(userAnswer)
        setLoading(true)

        const feedbackPrompt = `Question: ${mockInterviewQuestion[activeQuestionIndex]?.question}, User Answer: ${userAnswer}, Depends on question and user answer for the given interview question, please give us rating for the answer and feedback as area of improvement if any in just 3 to 5 lines to improve it in JSON format with rating field and feedback field`;

        let JsonFeedbackResp;
        try {
            const result = await chatSession.sendMessage(feedbackPrompt);
            const responseText = await result.response.text();
            console.log("Raw response text:", responseText);

            const mockJsonResp = responseText.replace('```json', '').replace('```', '');
            console.log("Parsed JSON response:", mockJsonResp);

            JsonFeedbackResp = JSON.parse(mockJsonResp);
            console.log("Feedback JSON:", JsonFeedbackResp);

            // Assuming the response should contain fields `rating` and `feedback`
            if (JsonFeedbackResp.rating && JsonFeedbackResp.feedback) {
                console.log("Rating:", JsonFeedbackResp.rating);
                console.log("Feedback:", JsonFeedbackResp.feedback);
            } else {
                console.log("Response does not contain expected fields");
            }
        } catch (error) {
            console.error("Error processing feedback:", error);
        }

        const resp = await db.insert(UserAnswer)
            .values({
                
                mockIdRef: interviewData?.mockId,
                question: mockInterviewQuestion[activeQuestionIndex]?.question,
                correctAns: mockInterviewQuestion[activeQuestionIndex]?.answer,
                userAns: userAnswer,
                feedback: JsonFeedbackResp?.feedback,
                rating: JsonFeedbackResp?.rating,
                userEmail: user?.primaryEmailAddress?.emailAddress,
                createdAt: moment().format('DD-MM-YYYY')
            })

        if (resp) {
            toast('User answer recorded successfully');
            setUserAnswer('');
            setResults([]);
        }
        setResults([]);

        setLoading(false);
    }

    return (
        <div className='flex items-center justify-center flex-col'>
            <div className='flex flex-col mt-20 justify-center items-center bg-black rounded-lg p-5'>
                <Image src={'/webcam.png'} width={200} height={200}
                    className='absolute' />
                <Webcam
                    mirrored={true}
                    style={{
                        height: 300,
                        width: '100%',
                        zIndex: 10
                    }}
                />
            </div>
            <Button 
                disabled={loading}
                variant="outline"
                className="my-10 flex gap-2 items-center"
                onClick={StartStopRecording}
            >
                <Mic className={isRecording ? 'text-red-600' : 'text-primary'} />
                <span className={isRecording ? 'text-red-600' : 'text-primary'}>
                    {isRecording ? 'Stop Recording' : 'Record Answer'}
                </span>
            </Button>
        </div>
    )
}

export default RecordAnswerSection;
