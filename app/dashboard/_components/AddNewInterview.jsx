"use client"
import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { chatSession } from '@/utils/GeminiAIModel'
import { LoaderCircle } from 'lucide-react'
import { db } from '@/utils/db'
import { MockInterview } from '@/utils/schema'
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@clerk/nextjs'
import moment from 'moment'
import { useRouter } from 'next/navigation'

function AddNewInterview() {
    const [openDialog, setOpenDialog] = useState(false)
    const [jobPosition, setJobPosition] = useState('');
    const [jobDesc, setJobDesc] = useState('');
    const [jobExperience, setJobExperience] = useState('');
    const [loading, setLoading] = useState(false);
    const [jsonResponse, setJsonResponse] = useState([]);
    const router = useRouter();
    const { user } = useUser();

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
    
        try {
            console.log(jobPosition, jobDesc, jobExperience);
    
            const inputPrompt = `Job Position: ${jobPosition}, Job Description: ${jobDesc}, Years of experience: ${jobExperience}, Depends on Job Position, Job Description and years of experience, Give ${process.env.NEXT_PUBLIC_INTERVIEW_QUESTION_COUNT} interview questions along with answer in JSON format, Give us question and answer field on JSON`;
    
            const result = await chatSession.sendMessage(inputPrompt);
            const rawResponse = await result.response.text();
            console.log('Raw response:', rawResponse); // Log the raw response for debugging
    
            // Attempt to clean the response more robustly
            const cleanedResponse = rawResponse
                .replace(/```json|```/g, '') // Remove code block markers
                .replace(/(?:\r\n|\r|\n)/g, '') // Remove newlines
                .trim();
            console.log('Cleaned response:', cleanedResponse); // Log the cleaned response
    
            // Try parsing the JSON
            let parsedResponse;
            try {
                parsedResponse = JSON.parse(cleanedResponse);
            } catch (parseError) {
                console.error('Error parsing JSON:', parseError.message);
                console.error('Failed JSON:', cleanedResponse);
                // Optionally handle the error or show a message to the user
                return;
            }
            console.log('Parsed JSON response:', parsedResponse);
            setJsonResponse(parsedResponse);
    
            if (parsedResponse) {
                const resp = await db.insert(MockInterview)
                    .values({
                        mockId: uuidv4(),
                        jsonMockResp: cleanedResponse,
                        jobPosition: jobPosition,
                        jobDesc: jobDesc,
                        jobExperience: jobExperience,
                        createdBy: user?.primaryEmailAddress?.emailAddress,
                        createdAt: moment().format('DD-MM-YYYY')
                    })
                    .returning({ mockId: MockInterview.mockId });
    
                console.log("Inserted ID:", resp);
                if (resp) {
                    setOpenDialog(false);
                    router.push('/dashboard/interview/' + resp[0]?.mockId);
                }
            } else {
                console.log("ERROR: Parsed response is null or undefined.");
            }
        } catch (error) {
            console.error("Error during submission:", error);
        } finally {
            setLoading(false);
        }
    }
    

    return (
        <div>
            <div className='p-10 border rounded-lg bg-secondary
            hover:scale-105 hover:shadow-md cursor-pointer transition-all'
                onClick={() => setOpenDialog(true)}
            >
                <h2 className='text-lg text-center'>+ Add New</h2>
            </div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger />
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Tell us more about your job interviewing</DialogTitle>
                        <DialogDescription>
                            <form onSubmit={onSubmit}>
                                <div>
                                    <h2 className='font-bold text-2xl'></h2>
                                    <h2>Add details about your job position/role, Job description and Years of experience</h2>
                                    <div className='mt-7 my-3'>
                                        <label>Job Role/Job Position</label>
                                        <Input placeholder="Eg. Full stack developer" required
                                            onChange={(event) => setJobPosition(event.target.value)}
                                        />
                                    </div>
                                    <div className=' my-3'>
                                        <label>Job Description/Tech Stack (In short)</label>
                                        <Textarea placeholder="Eg. React, Angular, NodeJs, MySql, etc" required
                                            onChange={(event) => setJobDesc(event.target.value)}
                                        />
                                    </div>
                                    <div className='my-3'>
                                        <label>Years of experience</label>
                                        <Input placeholder="Eg. 5" type="number" max="100" required
                                            onChange={(event) => setJobExperience(event.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className='flex gap-5 justify-end'>
                                    <Button type="button" variant="ghost" onClick={() => setOpenDialog(false)}>Cancel</Button>
                                    <Button type="submit" disabled={loading} >
                                        {loading ?
                                            <>
                                                <LoaderCircle className='animate-spin' />'Generating from AI'
                                            </> : 'Start Interview'
                                        }
                                    </Button>
                                </div>
                            </form>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default AddNewInterview
