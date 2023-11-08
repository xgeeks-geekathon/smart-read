import { UseChatHelpers } from 'ai/react'
import { Button } from '@/components/ui/button'

import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'
import { UploadForm } from './upload-form'
import { useState } from 'react'

const exampleMessages = [
  {
    heading: 'Explain technical concepts',
    message: `What is a "serverless function"?`
  },
  {
    heading: 'Summarize an article',
    message: 'Summarize the following article for a 2nd grader: \n'
  },
  {
    heading: 'Draft an email',
    message: `Draft an email to my boss about the following: \n`
  }
]

export function EmptyScreen({ setInput }: Pick<UseChatHelpers, 'setInput'>) {
  const [loading, setLoading] = useState(false)

  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border bg-background p-8">
        <h1 className="mb-2 text-lg font-semibold">Welcome to SmartRead</h1>
        <p className="mb-2 leading-normal text-muted-foreground">
          This app is for you to get an AI answer within the specific scope of a file
        </p>
        <p className="leading-normal text-muted-foreground">You must upload your file!</p>
        <div className="mt-4 flex flex-col items-start space-y-2">
        </div>
        <UploadForm setLoading={setLoading}/>
        {loading ? <span className='mt-2'>Loading...</span> : ""}
      </div>
    </div>
  )
}
