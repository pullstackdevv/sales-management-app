export default function Home() {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-6 md:max-w-md lg:max-w-lg">
                <div className="flex flex-col items-center text-center">
                    <img
                        className="w-24 h-24 rounded-full border-4 border-blue-500"
                        src="https://i.pravatar.cc/150?img=3"
                        alt="Avatar"
                    />
                    <h2 className="mt-4 text-xl font-semibold text-gray-800">
                        John Doe
                    </h2>
                    <p className="text-gray-500">Frontend Developer</p>
                    <div className="mt-4 flex gap-4">
                        <button className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition">
                            Follow
                        </button>
                        <button className="px-4 py-2 border border-blue-500 text-blue-500 rounded-full hover:bg-blue-50 transition">
                            Message
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
