import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter, createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';

import { Layout } from './app/layout';
import { blurerLoader, BlurerPage } from './app/pages/blurer/blurer.page';

const router = createBrowserRouter([
  {
    Component: Layout,
    children:[
      {
        id: "blurer",
        path: "/blur",
        loader: blurerLoader,
        element: <BlurerPage/>,
        // shouldRevalidate: ars=>{
        //   console.log(ars);
        //   if (ars.currentUrl.search !== ars.nextUrl.search || ars.formMethod === 'delete'){ // job deleted
        //     return true;
        //   }
        //   return false;
        // },
        
      },
      {
        path: "/",
        element:<Navigate to="/blur"/>
      }
    ]
  },
  
]);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
