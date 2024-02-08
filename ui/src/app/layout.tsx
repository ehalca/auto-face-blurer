import { Outlet } from "react-router-dom";


export const Layout: React.FC = () => {

    return (
        <div className="bg-slate-400">
            <div>
                <Outlet />
            </div>
        </div>
    );
}