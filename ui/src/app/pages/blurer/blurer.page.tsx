import { useLoaderData } from "react-router-dom";

export const blurerLoader = async ({ params }: any) => {
    return fetch('/api')
  };

export const BlurerPage: React.FC = () => {
    const data = useLoaderData();

    return <div>Blurrer: <pre className="text-2xl">{JSON.stringify(data, null, 2)}</pre></div>
}