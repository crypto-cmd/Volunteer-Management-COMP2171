
type PageTopBarProps = {
    role: string;
    onToggleRole?: () => void;
    navigateTo?: (view: string) => void;
    backTarget?: string;
    backLabel?: string;
};

export default function PageTopBar({
    role,
    onToggleRole,
    navigateTo,
    backTarget = "home",
    backLabel = "Back to Dashboard",
}: PageTopBarProps) {
    return (
        <div className="flex justify-between items-center mb-8 border-b pb-4">
            {navigateTo && (
                <button
                    onClick={() => navigateTo(backTarget)}
                    className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                    <span className="mr-2">←</span> {backLabel}
                </button>
            )}

            {onToggleRole ? (
                <div className="flex items-center space-x-3 bg-gray-100 p-2 rounded-lg ml-auto">
                    <span className={`font-medium text-sm ${role === "Volunteer" ? "text-blue-600" : "text-gray-500"}`}>
                        Volunteer
                    </span>
                    <button
                        onClick={onToggleRole}
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors"
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${role === "Admin" ? "translate-x-6" : "translate-x-1"
                                }`}
                        />
                    </button>
                    <span className={`font-medium text-sm ${role === "Admin" ? "text-blue-600" : "text-gray-500"}`}>
                        Admin
                    </span>
                </div>
            ) : (
                <div className="ml-auto px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                    {role}
                </div>
            )}
        </div>
    );
}
