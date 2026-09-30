import Header from "@/components/layout/Header";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-700">Dashboard</h2>
              <p className="mt-2 text-gray-500">Welcome to the AI Procurement platform.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
