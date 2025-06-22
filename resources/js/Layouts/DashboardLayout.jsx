import Header from "./header/Header";
import SidebarLayout from "./sidebar/Sidebar";

export default function DashboardLayout({ children }) {
    return (
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <SidebarLayout/>
  
        {/* Main */}
        <div className="flex-1 flex flex-col">

          {/* Page content */}
          <main className="flex-1 p-6 bg-gray-50">
            {children}
          </main>
  
          {/* Footer */}
          <footer className="bg-white shadow p-4 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} MyApp. All rights reserved.
          </footer>
        </div>
      </div>
    );
  }
  