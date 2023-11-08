import { Dispatch, SetStateAction, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from './ui/button'

interface Props {
  setLoading: Dispatch<SetStateAction<boolean>>
}

export const UploadForm = ({ setLoading }: Props) => {
  const [file, setFile] = useState<File>()

  const onSubmit = async (e: React.MouseEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)

    try {
      const data = new FormData()
      data.set('file', file)

      const _ = await fetch('/api/upload', {
        method: 'POST',
        body: data
      })
      // handle the error
    } catch (e: any) {
      // Handle errors here
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className=" flex items-center gap-1.5">
        <Input
        className=''
          onChange={e => setFile(e.target.files?.[0])}
          id="picture"
          type="file"
        />
        <Button
          className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-md ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          type="submit"
          value="Upload"
        >
          Upload
        </Button>
      </div>
    </form>
  )
}
