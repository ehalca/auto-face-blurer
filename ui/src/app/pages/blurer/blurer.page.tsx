import React, { useReducer } from 'react';
import { useFetcher, useLoaderData, useRevalidator } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
} from 'ui-components';
import { useBlurerEvents } from './use-blurer-events';
import JSZip from 'jszip';
import FileSaver from 'file-saver';

const supportsFileSystemAccessAPI =
  'getAsFileSystemHandle' in DataTransferItem.prototype;

export const blurerLoader = async ({ params }: any) => {
  return fetch('/api/batches');
};

export const uploadBatch = async (formData: FormData) => {
  return fetch('/api/batch', {
    method: 'POST',
    body: formData,
  });
};

export const blurerReducer = (state: BatchState[], action: any) => {
  if (Array.isArray(action)) {
    return action.map((batch) => {
      return Object.assign(
        {},
        batch,
        state.find((b) => b.id === batch.id)
      );
    }).sort((a,b)=>b.time-a.time);
  }
  if (action.batchFolder && action.code === undefined && !action.message) {
    return state.map((batch) => {
      if (batch.folder === action.batchFolder) {
        return {
          ...batch,
          loading: true,
        };
      }
      return batch;
    });
  }
  if (action.batchFolder && action.code === 0) {
    return state.map((batch) => {
      if (batch.folder === action.batchFolder) {
        return {
          ...batch,
          loading: false,
        };
      }
      return batch;
    });
  }
  if (action.batchFolder && action.message?.status === 'blurred') {
    return state.map((batch) => {
      if (batch.folder === action.batchFolder) {
        return {
          ...batch,
          output: [...batch.output, action.message.output],
        };
      }
      return batch;
    });
  }
  return state;
};

interface BatchState {
  folder: string;
  batchFolder: string;
  id: string;
  time: number;
  inputFolder: string;
  outputFolder: string;
  input: string[];
  output: string[];
  loading?: boolean;
}

export const BlurerPage: React.FC = () => {
  const rdata = useLoaderData() as any[];

  const [data, dispatch] = useReducer(blurerReducer, rdata);
  const revalidator = useRevalidator();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [fileList, setFileList] = React.useState<FileList | null>(null);

  useBlurerEvents(dispatch);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    uploadBatch(formData).then((res) => {
      console.log('res', res);
      revalidator.revalidate();
    });
  };
  React.useEffect(() => {
    dispatch(rdata);
  }, [rdata]);

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    // Prevent navigation.
    e.preventDefault();
    setFileList(e.dataTransfer.files);
  };

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.files = fileList;
    }
  }, [fileList]);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const downloadZip =async (batch: BatchState) => {
    const  files = await Promise.all(batch.output.map((file) => fetch(file).then(async (res) => ({file, res: await res.blob()}))));
    const zip = new JSZip();
    files.forEach((file, i) => {
      zip.file(file.file.split('/').pop() ?? `fisier_${i}`, file.res);
    });
    zip.generateAsync({type:"blob"}).then((blob) => {
      FileSaver.saveAs(blob, `${batch.id}.zip`);
    });
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div
          onDragOver={onDragOver}
          onDrop={onDrop}
          className="bg-gray-50 text-center px-4 rounded w-80 flex flex-col items-center justify-center cursor-pointer border-2 border-gray-400 border-dashed mx-auto font-[sans-serif]"
        >
          <div className="py-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 mb-2 fill-gray-600 inline-block"
              viewBox="0 0 32 32"
            >
              <path
                d="M23.75 11.044a7.99 7.99 0 0 0-15.5-.009A8 8 0 0 0 9 27h3a1 1 0 0 0 0-2H9a6 6 0 0 1-.035-12 1.038 1.038 0 0 0 1.1-.854 5.991 5.991 0 0 1 11.862 0A1.08 1.08 0 0 0 23 13a6 6 0 0 1 0 12h-3a1 1 0 0 0 0 2h3a8 8 0 0 0 .75-15.956z"
                data-original="#000000"
              />
              <path
                d="M20.293 19.707a1 1 0 0 0 1.414-1.414l-5-5a1 1 0 0 0-1.414 0l-5 5a1 1 0 0 0 1.414 1.414L15 16.414V29a1 1 0 0 0 2 0V16.414z"
                data-original="#000000"
              />
            </svg>
            <h4 className="text-base font-semibold text-gray-600">
              Grag and drop files here
            </h4>
          </div>
          <hr className="w-full border-gray-400 my-2" />
          <div className="py-6">
            <form onSubmit={handleSubmit}>
              <input
                type="file"
                name="files"
                placeholder="search"
                multiple
                accept="image/*"
                className="hidden"
                id="uploadFile1"
                ref={inputRef}
              />

              <label
                htmlFor="uploadFile1"
                className="hidden block px-6 py-2.5 rounded text-gray-600 text-sm tracking-wider font-semibold border-none outline-none bg-gray-200 hover:bg-gray-100"
              >
                Browse Files
              </label>
              <p className="text-xs text-gray-400 mt-4">
                PNG, JPG SVG, WEBP, and GIF are Allowed.
              </p>
              <Button
                type="submit"
                variant={'destructive'}
                disabled={!fileList || fileList.length === 0}
              >
                Upload {fileList && `${fileList?.length} files`}
              </Button>
            </form>
          </div>
        </div>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {data.map((batch: any) => {
          const time = new Date(Number(batch.time));
          const date = time.toLocaleDateString();
          const timeString = time.toLocaleTimeString();
          return (
            <AccordionItem
              value={batch.id}
              key={batch.id}
              className="p-2 bg-slate-800 text-white rounded-md"
            >
              <AccordionTrigger>
                {date} {timeString} - {batch.output.length} /{' '}
                {batch.input.length}
                {batch.loading && '...loading'}
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4">
                <div className="flex flex-row flex-wrap gap-4 justify-center">
                  {batch.input.map((input: any) => (
                    <img
                      key={input}
                      src={input}
                      className="aspect-square max-w-[20%] object-contain"
                    />
                  ))}
                </div>
                <div className="flex flex-row flex-wrap gap-4 justify-center">
                  {batch.output.map((output: any) => (
                    <img
                      key={output}
                      src={output}
                      className="aspect-square max-w-[20%] object-contain"
                    />
                  ))}
                </div>
                <div className='w-full'>
                  <Button variant={'secondary'} className="mx-auto" onClick={e=>downloadZip(batch)} disabled={batch.output.length === 0}>
                    Download
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
