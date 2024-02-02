import { Outlet } from "react-router-dom";


export const Layout: React.FC = () => {

    return (
        <div>
            <h1>Layout </h1>
            <div>
                <Outlet />
            </div>
        </div>
    );
}