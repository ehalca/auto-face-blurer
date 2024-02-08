import React from "react";

export const useBlurerEvents = (cb: (event: any)=>void) => {

    const eventSourceRef = React.useRef<EventSource | null>(null);


    React.useEffect(() => {
        const eventSource = new EventSource(`/api/sse`);
        eventSource.onmessage = (event) => {
            cb(JSON.parse(event.data));
        }
        eventSourceRef.current = eventSource;
        return () => {
            eventSource.close();
        }
    }, []);
}